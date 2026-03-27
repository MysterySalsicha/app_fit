using FitnessTrack.Application.Services;
using FitnessTrack.Core.Entities;
using FitnessTrack.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text.Json;

namespace FitnessTrack.API.Controllers;

[ApiController]
[Route("api/ai-coach")]
[Authorize]
public class CoachController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IWorkoutParserService _parser;

    public CoachController(AppDbContext db, IWorkoutParserService parser)
    {
        _db    = db;
        _parser = parser;
    }

    private Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // ─────────────────────────────────────────────────────────────────────────
    // ONBOARDING
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// POST /api/ai-coach/onboarding
    /// Save onboarding answers, build user profile, mark onboarding complete.
    /// </summary>
    [HttpPost("onboarding")]
    public async Task<IActionResult> ProcessOnboarding([FromBody] OnboardingDto dto)
    {
        var userId = UserId;
        var user = await _db.Users.FindAsync(userId);
        if (user == null) return NotFound();

        // ── Apply answers to user profile ────────────────────────────────────
        if (dto.Answers.TryGetValue("goal", out var goal))
            user.FitnessGoal = NormalizeGoal(goal);

        if (dto.Answers.TryGetValue("experience", out var exp))
            user.ExperienceLevel = NormalizeExperience(exp);

        if (dto.Answers.TryGetValue("daysPerWeek", out var days) && int.TryParse(days, out var daysInt))
            user.PreferredDaysPerWeek = daysInt;

        if (dto.Answers.TryGetValue("location", out var loc))
            user.TrainingLocation = NormalizeLocation(loc);

        if (dto.Answers.TryGetValue("sex", out var sex))
            user.Sex = sex?.ToUpper() switch { "MALE" or "M" => "M", "FEMALE" or "F" => "F", _ => "X" };

        if (dto.Answers.TryGetValue("birthdate", out var bd) && DateOnly.TryParse(bd, out var birthdate))
            user.Birthdate = birthdate;

        if (dto.Answers.TryGetValue("injuries", out var injuriesRaw) && !string.IsNullOrWhiteSpace(injuriesRaw))
            user.Injuries = injuriesRaw.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        if (dto.Answers.TryGetValue("notificationTone", out var tone))
            user.NotificationTone = tone ?? "balanced";

        user.OnboardingCompleted = true;
        user.OnboardingCompletedAt = DateTime.UtcNow;

        // ── Generate AI analysis (deterministic, no LLM call required) ───────
        var (recommendedPlan, nutritionModule, analysisMessage, hunterClass) = BuildAnalysis(user, dto.Answers);
        var analysis = new { recommendedPlan, nutritionModule, message = analysisMessage, hunterClass };

        // ── Persist onboarding response ───────────────────────────────────────
        var existing = await _db.OnboardingResponses
            .FirstOrDefaultAsync(o => o.UserId == userId);

        if (existing == null)
        {
            _db.OnboardingResponses.Add(new OnboardingResponse
            {
                UserId = userId,
                ResponsesJson = JsonSerializer.Serialize(dto.Answers),
                AiAnalysis = JsonSerializer.Serialize(analysis),
            });
        }
        else
        {
            existing.ResponsesJson = JsonSerializer.Serialize(dto.Answers);
            existing.AiAnalysis = JsonSerializer.Serialize(analysis);
        }

        // ── Assign initial rank via hunter profile ────────────────────────────
        var hp = await _db.HunterProfiles.FirstOrDefaultAsync(h => h.UserId == userId);
        if (hp != null && hp.HunterRank == "E")
        {
            hp.HunterRank = user.ExperienceLevel switch
            {
                "intermediate" => "D",
                "advanced"     => "C",
                "athlete"      => "B",
                _              => "E",
            };
        }

        await _db.SaveChangesAsync();

        // ── Gerar plano de treino automático se usuário ainda não tem nenhum ──
        bool planGenerated = false;
        var hasPlan = await _db.WorkoutPlans.AnyAsync(p => p.UserId == userId);
        if (!hasPlan)
        {
            var planTxt = GeneratePlanTxt(
                user.ExperienceLevel ?? "beginner",
                user.PreferredDaysPerWeek ?? 3,
                user.TrainingLocation   ?? "full_gym");

            var plan = _parser.Parse(planTxt, userId);
            plan.Name = $"Plano {recommendedPlan}";
            _db.WorkoutPlans.Add(plan);
            await _db.SaveChangesAsync();
            planGenerated = true;
        }

        return Ok(new
        {
            profile = new
            {
                fitnessGoal      = user.FitnessGoal,
                experienceLevel  = user.ExperienceLevel,
                daysPerWeek      = user.PreferredDaysPerWeek,
                trainingLocation = user.TrainingLocation,
                hunterRank       = hp?.HunterRank,
            },
            analysis,
            planGenerated,
            message = planGenerated
                ? "Análise concluída. Plano de treino gerado e pronto para usar."
                : "Análise concluída. O Sistema reconhece seu potencial.",
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CHAT
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>GET /api/ai-coach/chat — conversation history (last 50 messages)</summary>
    [HttpGet("chat")]
    public async Task<IActionResult> GetChat([FromQuery] int limit = 50)
    {
        var messages = await _db.AiCoachConversations
            .Where(c => c.UserId == UserId)
            .OrderByDescending(c => c.CreatedAt)
            .Take(limit)
            .OrderBy(c => c.CreatedAt)
            .Select(c => new { c.Id, c.Role, c.Message, c.CreatedAt })
            .ToListAsync();

        return Ok(messages);
    }

    /// <summary>POST /api/ai-coach/chat — send a message</summary>
    [HttpPost("chat")]
    public async Task<IActionResult> SendMessage([FromBody] ChatMessageDto dto)
    {
        var userId = UserId;

        // Save user message
        _db.AiCoachConversations.Add(new AiCoachConversation
        {
            UserId  = userId,
            Role    = "user",
            Message = dto.Message,
        });

        // Build deterministic coach reply based on keywords
        var reply = BuildCoachReply(dto.Message, userId);

        _db.AiCoachConversations.Add(new AiCoachConversation
        {
            UserId  = userId,
            Role    = "assistant",
            Message = reply,
        });

        await _db.SaveChangesAsync();

        return Ok(new { reply });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // INSIGHTS
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>GET /api/ai-coach/insights</summary>
    [HttpGet("insights")]
    public async Task<IActionResult> GetInsights([FromQuery] bool includesDismissed = false)
    {
        var q = _db.AiInsights.Where(i => i.UserId == UserId);
        if (!includesDismissed) q = q.Where(i => i.DismissedAt == null);

        var insights = await q
            .OrderByDescending(i => i.CreatedAt)
            .Take(20)
            .Select(i => new
            {
                i.Id, i.InsightType, i.Title, i.Body, i.Severity,
                i.ActedUpon, i.DismissedAt, i.CreatedAt,
            })
            .ToListAsync();

        return Ok(insights);
    }

    /// <summary>POST /api/ai-coach/insights/{id}/dismiss</summary>
    [HttpPost("insights/{id:guid}/dismiss")]
    public async Task<IActionResult> DismissInsight(Guid id)
    {
        var insight = await _db.AiInsights.FirstOrDefaultAsync(i => i.Id == id && i.UserId == UserId);
        if (insight == null) return NotFound();
        insight.DismissedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CHECK-INS
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>GET /api/ai-coach/checkin/pending</summary>
    [HttpGet("checkin/pending")]
    public async Task<IActionResult> GetPendingCheckin()
    {
        var userId = UserId;
        var user = await _db.Users.FindAsync(userId);
        if (user == null) return NotFound();

        // Check if there is already an incomplete checkin
        var pending = await _db.AiCheckins
            .Where(c => c.UserId == userId && c.CompletedAt == null)
            .OrderByDescending(c => c.CreatedAt)
            .FirstOrDefaultAsync();

        if (pending != null)
        {
            return Ok(new
            {
                hasPending    = true,
                checkinId     = pending.Id,
                checkinType   = pending.CheckinType,
                questions     = JsonSerializer.Deserialize<object>(pending.QuestionsJson),
            });
        }

        // Generate a weekly check-in if none for this week
        var weekAgo = DateTime.UtcNow.AddDays(-7);
        var recentCheckin = await _db.AiCheckins
            .AnyAsync(c => c.UserId == userId && c.CreatedAt >= weekAgo);

        if (!recentCheckin)
        {
            var questions = new[]
            {
                new { id = "energy",    question = "Como está seu nível de energia nos treinos esta semana? (1–5)" },
                new { id = "soreness",  question = "Você sentiu dor muscular excessiva? (sim/não)" },
                new { id = "sleep",     question = "Como está seu sono? (ruim / regular / bom / excelente)" },
                new { id = "adherence", question = "Quantos treinos você completou conforme planejado?" },
            };

            var checkin = new AiCheckin
            {
                UserId        = userId,
                CheckinType   = "weekly",
                QuestionsJson = JsonSerializer.Serialize(questions),
            };
            _db.AiCheckins.Add(checkin);
            await _db.SaveChangesAsync();

            return Ok(new
            {
                hasPending  = true,
                checkinId   = checkin.Id,
                checkinType = "weekly",
                questions,
            });
        }

        return Ok(new { hasPending = false });
    }

    /// <summary>POST /api/ai-coach/checkin — submit answers</summary>
    [HttpPost("checkin")]
    public async Task<IActionResult> SubmitCheckin([FromBody] CheckinAnswerDto dto)
    {
        var checkin = await _db.AiCheckins
            .FirstOrDefaultAsync(c => c.Id == dto.CheckinId && c.UserId == UserId);
        if (checkin == null) return NotFound();

        checkin.AnswersJson    = JsonSerializer.Serialize(dto.Answers);
        checkin.AiAnalysis     = BuildCheckinAnalysis(dto.Answers);
        checkin.CompletedAt    = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return Ok(new { analysis = checkin.AiAnalysis });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // WEEKLY ANALYSIS
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>GET /api/ai-coach/weekly-analysis</summary>
    [HttpGet("weekly-analysis")]
    public async Task<IActionResult> GetWeeklyAnalysis()
    {
        var userId = UserId;
        var weekAgo = DateTime.UtcNow.AddDays(-7);

        var sessions = await _db.WorkoutSessions
            .Where(s => s.UserId == userId && s.StartedAt >= weekAgo && s.FinishedAt != null)
            .Select(s => new { s.TotalVolumeLoadKg, s.XpEarned, s.TotalDurationSeconds })
            .ToListAsync();

        var totalVolume  = sessions.Sum(s => (double)(s.TotalVolumeLoadKg ?? 0));
        var totalXp      = sessions.Sum(s => s.XpEarned);
        var totalSessions = sessions.Count;

        var insights = new List<string>();
        if (totalSessions == 0) insights.Add("Nenhum treino registrado esta semana. O Sistema aguarda seu retorno.");
        else if (totalSessions >= 4) insights.Add($"Excelente semana! {totalSessions} treinos concluídos.");
        else insights.Add($"{totalSessions} treino(s) concluído(s). Continue no ritmo.");

        if (totalVolume > 10000) insights.Add($"Volume total impressionante: {totalVolume:F0} kg.");

        return Ok(new
        {
            weekSessions  = totalSessions,
            totalVolumeKg = Math.Round(totalVolume, 0),
            totalXp,
            insights,
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SAGAS
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>GET /api/sagas</summary>
    [HttpGet("/api/sagas")]
    public async Task<IActionResult> GetSagas()
    {
        var userId = UserId;
        var activeSaga = await _db.Sagas
            .Where(s => s.UserId == userId && s.Status == "active")
            .FirstOrDefaultAsync();

        var available = BuildAvailableSagas();

        return Ok(new { activeSaga, available });
    }

    /// <summary>POST /api/sagas/{type}/start</summary>
    [HttpPost("/api/sagas/{type}/start")]
    public async Task<IActionResult> StartSaga(string type)
    {
        var userId = UserId;

        // Only one active saga at a time
        var existing = await _db.Sagas
            .AnyAsync(s => s.UserId == userId && s.Status == "active");
        if (existing) return BadRequest(new { error = "Você já possui uma Saga ativa." });

        var template = BuildAvailableSagas().FirstOrDefault(s => s.Type == type);
        if (template == null) return NotFound(new { error = "Tipo de Saga desconhecido." });

        var saga = new Saga
        {
            UserId      = userId,
            SagaType    = type,
            SagaName    = template.Name,
            Description = template.Description,
            DurationDays = template.DurationDays,
            StartedAt   = DateTime.UtcNow,
            EndsAt      = DateTime.UtcNow.AddDays(template.DurationDays),
            Status      = "active",
            GoalsJson   = JsonSerializer.Serialize(template.Goals),
            RewardsJson = JsonSerializer.Serialize(template.Rewards),
        };

        _db.Sagas.Add(saga);
        await _db.SaveChangesAsync();

        return Ok(saga);
    }

    /// <summary>POST /api/sagas/{id}/abandon</summary>
    [HttpPost("/api/sagas/{id:guid}/abandon")]
    public async Task<IActionResult> AbandonSaga(Guid id)
    {
        var saga = await _db.Sagas.FirstOrDefaultAsync(s => s.Id == id && s.UserId == UserId);
        if (saga == null) return NotFound();
        saga.Status = "abandoned";
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // USER GOALS
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>GET /api/goals</summary>
    [HttpGet("/api/goals")]
    public async Task<IActionResult> GetGoals()
    {
        var goals = await _db.UserGoals
            .Where(g => g.UserId == UserId && g.IsActive)
            .OrderBy(g => g.CreatedAt)
            .ToListAsync();
        return Ok(goals);
    }

    /// <summary>POST /api/goals</summary>
    [HttpPost("/api/goals")]
    public async Task<IActionResult> AddGoal([FromBody] UserGoalDto dto)
    {
        var goal = new UserGoal
        {
            UserId          = UserId,
            GoalType        = dto.GoalType,
            GoalDescription = dto.GoalDescription,
            TargetValue     = dto.TargetValue,
            CurrentValue    = dto.CurrentValue ?? 0,
            Unit            = dto.Unit,
        };
        _db.UserGoals.Add(goal);
        await _db.SaveChangesAsync();
        return Created($"/api/goals/{goal.Id}", goal);
    }

    /// <summary>PUT /api/goals/{id}</summary>
    [HttpPut("/api/goals/{id:guid}")]
    public async Task<IActionResult> UpdateGoal(Guid id, [FromBody] UpdateGoalDto dto)
    {
        var goal = await _db.UserGoals.FirstOrDefaultAsync(g => g.Id == id && g.UserId == UserId);
        if (goal == null) return NotFound();

        goal.CurrentValue = dto.CurrentValue;
        if (goal.TargetValue.HasValue && goal.CurrentValue >= goal.TargetValue.Value)
            goal.AchievedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return Ok(goal);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // WEEKLY GOALS
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>GET /api/weekly-goals</summary>
    [HttpGet("/api/weekly-goals")]
    public async Task<IActionResult> GetWeeklyGoals()
    {
        var userId = UserId;
        var monday = DateOnly.FromDateTime(
            DateTime.UtcNow.AddDays(-(int)DateTime.UtcNow.DayOfWeek + (int)DayOfWeek.Monday));

        var wg = await _db.WeeklyGoals
            .FirstOrDefaultAsync(w => w.UserId == userId && w.WeekStart == monday);

        if (wg == null)
        {
            // Auto-generate weekly goals based on user profile
            var user = await _db.Users.FindAsync(userId);
            var goals = GenerateWeeklyGoals(user);

            wg = new WeeklyGoal
            {
                UserId        = userId,
                WeekStart     = monday,
                GoalsJson     = JsonSerializer.Serialize(goals),
                GeneratedByAi = true,
            };
            _db.WeeklyGoals.Add(wg);
            await _db.SaveChangesAsync();
        }

        return Ok(new
        {
            wg.Id, wg.WeekStart, wg.CompletionPct, wg.AcceptedByUser,
            goals = JsonSerializer.Deserialize<object>(wg.GoalsJson),
        });
    }

    /// <summary>POST /api/weekly-goals/accept</summary>
    [HttpPost("/api/weekly-goals/accept")]
    public async Task<IActionResult> AcceptWeeklyGoals()
    {
        var userId = UserId;
        var monday = DateOnly.FromDateTime(
            DateTime.UtcNow.AddDays(-(int)DateTime.UtcNow.DayOfWeek + (int)DayOfWeek.Monday));

        var wg = await _db.WeeklyGoals
            .FirstOrDefaultAsync(w => w.UserId == userId && w.WeekStart == monday);
        if (wg == null) return NotFound();

        wg.AcceptedByUser = true;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PRIVATE HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    private static string NormalizeGoal(string? raw) => raw?.ToLower() switch
    {
        "a" or "fat_loss"     => "fat_loss",
        "b" or "muscle_gain"  => "muscle_gain",
        "c" or "strength"     => "strength",
        "d" or "maintenance"  => "maintenance",
        "e" or "recomposition"=> "recomposition",
        "f" or "return"       => "return",
        _ => raw ?? "maintenance",
    };

    private static string NormalizeExperience(string? raw) => raw?.ToLower() switch
    {
        "a" or "never"        => "beginner",
        "b" or "beginner"     => "beginner",
        "c" or "intermediate" => "intermediate",
        "d" or "advanced"     => "advanced",
        "e" or "athlete"      => "athlete",
        _ => "beginner",
    };

    private static string NormalizeLocation(string? raw) => raw?.ToLower() switch
    {
        "a" or "full_gym"         => "full_gym",
        "b" or "basic_gym"        => "basic_gym",
        "c" or "home_equipment"   => "home_equipment",
        "d" or "home_bodyweight"  => "home_bodyweight",
        "e" or "outdoor"          => "outdoor",
        _ => "full_gym",
    };

    private static (string RecommendedPlan, bool NutritionModule, string Message, string HunterClass) BuildAnalysis(User user, Dictionary<string, string> answers)
    {
        var planType = (user.ExperienceLevel, user.PreferredDaysPerWeek) switch
        {
            ("beginner", <= 3) => "Full Body 3x",
            ("beginner", _)    => "Full Body 4x",
            ("intermediate", <= 4) => "Upper/Lower Split",
            ("intermediate", _)    => "PPL (Push/Pull/Legs)",
            ("advanced", _)    => "PPL ou Upper/Lower",
            ("athlete", _)     => "Programa Customizado",
            _ => "Full Body 3x",
        };

        bool nutritionModule = user.FitnessGoal is "fat_loss" or "recomposition" or "muscle_gain";
        string hunterClass = user.ExperienceLevel switch
        {
            "beginner"     => "Caçador Iniciante",
            "intermediate" => "Caçador Veterano",
            "advanced"     => "Elite Hunter",
            "athlete"      => "National Level Hunter",
            _              => "Caçador Iniciante",
        };

        return (planType, nutritionModule,
            $"Com base no seu perfil, o Sistema recomenda: {planType}.",
            hunterClass);
    }

    /// <summary>
    /// Gera um TXT de plano de treino baseado no perfil do usuário para ser
    /// processado pelo WorkoutParserService. Funciona como plano inicial automático.
    /// </summary>
    private static string GeneratePlanTxt(string experience, int days, string location)
    {
        // Exercícios adaptados para treino em casa sem equipamento
        bool bodyweight = location is "home_bodyweight" or "outdoor";

        return (experience, days) switch
        {
            // ─── INICIANTE ───────────────────────────────────────────────────
            ("beginner", <= 3) => bodyweight
                ? @"DIA 1 - FULL BODY A (Peito/Costas/Pernas)
Flexão de Braço | 3x8-12 | Descanso: 90s
Agachamento Livre | 3x12-15 | Descanso: 90s
Remada com Elástico | 3x12-15 | Descanso: 75s
Afundo | 3x10-12 | Descanso: 60s
Prancha | 3x30s | Descanso: 45s

DIA 2 - DESCANSO

DIA 3 - FULL BODY B (Ombros/Costas/Core)
Flexão Pike | 3x8-12 | Descanso: 90s
Agachamento Sumô | 3x12-15 | Descanso: 75s
Remada Invertida | 3x10-12 | Descanso: 75s
Extensão de Quadril | 3x15 | Descanso: 60s
Abdominal Crunch | 3x20 | Descanso: 45s

DIA 4 - DESCANSO

DIA 5 - FULL BODY C (Força Total)
Flexão Diamante | 3x8-12 | Descanso: 90s
Agachamento com Salto | 3x10 | Descanso: 90s
Superman | 3x15 | Descanso: 60s
Prancha Lateral | 3x20s | Descanso: 45s

DIA 6 - DESCANSO
DIA 7 - DESCANSO"
                : @"DIA 1 - FULL BODY A (Peito/Costas/Pernas)
Supino Reto com Halteres | 3x8-12 | Descanso: 90s
Agachamento Livre | 3x8-12 | Descanso: 90s
Remada Curvada com Halteres | 3x10-12 | Descanso: 90s
Desenvolvimento com Halteres | 3x10-12 | Descanso: 60s
Rosca Direta com Halteres | 3x12-15 | Descanso: 60s

DIA 2 - DESCANSO

DIA 3 - FULL BODY B (Ombros/Costas/Core)
Supino Inclinado com Halteres | 3x8-12 | Descanso: 90s
Leg Press 45 | 3x10-12 | Descanso: 90s
Puxada na Polia Alta | 3x10-12 | Descanso: 75s
Elevação Lateral | 3x12-15 | Descanso: 60s
Tríceps na Polia | 3x12-15 | Descanso: 60s

DIA 4 - DESCANSO

DIA 5 - FULL BODY C (Força Total)
Agachamento com Barra | 3x6-10 | Descanso: 120s
Levantamento Terra | 3x6-10 | Descanso: 120s
Supino Reto com Barra | 3x6-10 | Descanso: 120s
Prancha | 3x30s | Descanso: 45s

DIA 6 - DESCANSO
DIA 7 - DESCANSO",

            ("beginner", _) => @"DIA 1 - UPPER A (Peito/Ombros)
Supino Reto com Halteres | 3x8-12 | Descanso: 90s
Desenvolvimento com Halteres | 3x10-12 | Descanso: 75s
Elevação Lateral | 3x12-15 | Descanso: 60s
Rosca Direta | 3x12-15 | Descanso: 60s
Tríceps na Polia | 3x12-15 | Descanso: 60s

DIA 2 - LOWER A (Quadríceps/Glúteos)
Agachamento Livre | 3x8-12 | Descanso: 90s
Leg Press 45 | 3x10-12 | Descanso: 90s
Extensão de Joelho | 3x12-15 | Descanso: 60s
Panturrilha em Pé | 3x15-20 | Descanso: 45s

DIA 3 - DESCANSO

DIA 4 - UPPER B (Costas/Bíceps)
Puxada na Polia Alta | 3x8-12 | Descanso: 90s
Remada Curvada com Halteres | 3x10-12 | Descanso: 90s
Pullover com Halter | 3x12 | Descanso: 60s
Rosca Martelo | 3x12-15 | Descanso: 60s

DIA 5 - LOWER B (Isquiotibiais/Glúteos)
Levantamento Terra Romeno | 3x8-12 | Descanso: 90s
Cadeira Flexora | 3x12-15 | Descanso: 60s
Afundo | 3x10-12 | Descanso: 75s
Abdômen Crunch | 3x20 | Descanso: 45s

DIA 6 - DESCANSO
DIA 7 - DESCANSO",

            // ─── INTERMEDIÁRIO ───────────────────────────────────────────────
            ("intermediate", <= 4) => @"DIA 1 - UPPER A (Peito/Ombros/Tríceps)
Supino Reto com Barra | 4x6-10 | Descanso: 120s
Supino Inclinado com Halteres | 3x8-12 | Descanso: 90s
Desenvolvimento com Barra | 4x8-12 | Descanso: 90s
Elevação Lateral | 3x12-15 | Descanso: 60s
Tríceps Polia Alta | 3x12-15 | Descanso: 60s

DIA 2 - LOWER A (Quadríceps/Glúteos/Panturrilha)
Agachamento com Barra | 4x5-8 | Descanso: 120s
Leg Press 45 | 4x10-12 | Descanso: 90s
Extensão de Joelho | 3x12-15 | Descanso: 60s
Afundo com Halteres | 3x10-12 | Descanso: 75s
Panturrilha em Pé | 4x15-20 | Descanso: 45s

DIA 3 - DESCANSO

DIA 4 - UPPER B (Costas/Bíceps/Ombro Posterior)
Barra Fixa Supinada | 4x6-10 | Descanso: 120s
Remada Curvada com Barra | 4x8-12 | Descanso: 90s
Puxada na Polia Alta | 3x10-12 | Descanso: 75s
Rosca Direta com Barra | 3x10-12 | Descanso: 60s
Elevação com Inclinação | 3x15 | Descanso: 45s

DIA 5 - LOWER B (Isquiotibiais/Glúteos/Core)
Levantamento Terra | 4x4-6 | Descanso: 180s
Cadeira Flexora | 3x12-15 | Descanso: 60s
Levantamento Terra Romeno | 3x10-12 | Descanso: 90s
Hip Thrust | 3x12-15 | Descanso: 75s
Prancha | 3x45s | Descanso: 45s

DIA 6 - DESCANSO
DIA 7 - DESCANSO",

            _ => @"DIA 1 - PUSH (Peito/Ombros/Tríceps)
Supino Reto com Barra | 4x5-8 | Descanso: 120s
Supino Inclinado com Halteres | 4x8-12 | Descanso: 90s
Desenvolvimento com Barra | 4x8-12 | Descanso: 90s
Elevação Lateral | 3x12-15 | Descanso: 60s
Tríceps Polia Alta | 3x12-15 | Descanso: 60s
Tríceps Coice | 3x12-15 | Descanso: 60s

DIA 2 - PULL (Costas/Bíceps/Ombro Posterior)
Barra Fixa Supinada | 4x6-10 | Descanso: 120s
Remada Curvada com Barra | 4x8-10 | Descanso: 90s
Puxada na Polia Alta | 3x10-12 | Descanso: 75s
Rosca Direta com Barra | 3x10-12 | Descanso: 60s
Rosca Martelo | 3x12-15 | Descanso: 60s

DIA 3 - LEGS (Quadríceps/Isquiotibiais/Glúteos)
Agachamento com Barra | 4x5-8 | Descanso: 180s
Leg Press 45 | 4x10-12 | Descanso: 90s
Extensão de Joelho | 3x12-15 | Descanso: 60s
Cadeira Flexora | 3x12-15 | Descanso: 60s
Panturrilha em Pé | 4x15-20 | Descanso: 45s

DIA 4 - DESCANSO

DIA 5 - PUSH B (Peito/Ombros/Tríceps)
Supino Reto com Halteres | 4x8-12 | Descanso: 90s
Crossover Polia | 3x12-15 | Descanso: 60s
Desenvolvimento Arnold | 4x10-12 | Descanso: 90s
Tríceps Franzido | 3x12-15 | Descanso: 60s

DIA 6 - PULL B (Costas/Bíceps)
Remada Unilateral com Halter | 4x8-12 | Descanso: 90s
Pullover com Halter | 3x12-15 | Descanso: 60s
Rosca Concentrada | 3x12-15 | Descanso: 60s

DIA 7 - DESCANSO",
        };
    }

    private static string BuildCoachReply(string message, Guid userId)
    {
        var lower = message.ToLowerInvariant();

        if (lower.Contains("plateau") || lower.Contains("não evoluo"))
            return "O Sistema detectou estagnação. Tente aumentar o peso em 2,5 kg ou adicionar 1 série extra nos exercícios principais. Deload pode ser necessário.";

        if (lower.Contains("cansad") || lower.Contains("over"))
            return "Sinais de overtraining detectados. Reduza intensidade 30% nesta semana e priorize sono de 8h. O Sistema exige recuperação tanto quanto treino.";

        if (lower.Contains("nutri") || lower.Contains("calor") || lower.Contains("proteína"))
            return "Para suporte nutricional: acesse Configurações → Metas Nutricionais para ajustar seus macros. O Sistema calculou seu TDEE com base no seu perfil.";

        if (lower.Contains("plano") || lower.Contains("treino"))
            return "Seu plano de treino está em Treinos → Hoje. O Sistema adapta dificuldade a cada 4 semanas com base no seu progresso.";

        return "O Sistema recebeu sua mensagem. Continue treinando com foco. Cada sessão te aproxima do próximo nível.";
    }

    private static string BuildCheckinAnalysis(Dictionary<string, string> answers)
    {
        var parts = new List<string>();

        if (answers.TryGetValue("energy", out var energy) && int.TryParse(energy, out var e))
        {
            if (e <= 2) parts.Add("Energia baixa detectada — considere reduzir volume esta semana.");
            else if (e >= 4) parts.Add("Alta energia! Semana ideal para aumentar intensidade.");
        }

        if (answers.TryGetValue("soreness", out var soreness) && soreness.ToLower().Contains("sim"))
            parts.Add("Dor muscular excessiva. Priorize alongamento e recuperação ativa.");

        if (answers.TryGetValue("sleep", out var sleep) && (sleep.ToLower().Contains("ruim") || sleep.ToLower().Contains("regular")))
            parts.Add("Sono inadequado impacta ganhos. Tente dormir 30 min mais cedo esta semana.");

        return parts.Count > 0
            ? string.Join(" ", parts)
            : "Check-in registrado. Continue no ritmo e o Sistema monitorará seu progresso.";
    }

    private static IEnumerable<object> GenerateWeeklyGoals(User? user)
    {
        var days = user?.PreferredDaysPerWeek ?? 4;
        return new[]
        {
            new { id = "sessions",   label = $"Completar {days} treinos",  target = days, unit = "treinos" },
            new { id = "volume",     label = "Volume total ≥ 8.000 kg",    target = 8000, unit = "kg" },
            new { id = "protein",    label = "Proteína ≥ 150g por dia",    target = 7,    unit = "dias" },
        };
    }

    private static List<SagaTemplate> BuildAvailableSagas() =>
    [
        new("cut",                "Operation: Fat Burn",         "Protocolo de definição de 8 semanas",         56,
            goals: ["Déficit calórico diário", "Cardio 3x semana", "Manter força"],
            rewards: ["Título: The Lean Hunter", "+3000 XP", "Badge: Cut Survivor"]),
        new("bulk",               "Operation: Mass Protocol",    "Protocolo de hipertrofia de 12 semanas",      84,
            goals: ["Superávit calórico diário", "Volume progressivo", "5 PRs novos"],
            rewards: ["Título: The Iron Titan", "+5000 XP", "Badge: Mass Builder"]),
        new("beginner_awakening", "The Awakening",               "Missão de 30 dias para caçadores iniciantes", 30,
            goals: ["12 treinos completados", "Dominar os básicos", "Primeira PR"],
            rewards: ["Rank D desbloqueado", "+2000 XP", "Badge: First Awakening"]),
        new("strength_marathon",  "Strength Marathon",           "Programa de força de 16 semanas",            112,
            goals: ["1RM Supino +10%", "1RM Agachamento +15%", "1RM Levantamento +20%"],
            rewards: ["Título: The Strength God", "+8000 XP", "Badge: Powerlifter"]),
        new("cardio_warrior",     "Cardio Warrior",              "Desafio cardiovascular de 6 semanas",         42,
            goals: ["Cardio 5x semana", "VO2 max estimado", "5 km em 25min"],
            rewards: ["Título: The Cardio King", "+2500 XP", "Badge: Endurance Master"]),
        new("rehab_warrior",      "Rehab Warrior",               "Retorno seguro ao treino em 6 semanas",       42,
            goals: ["Recuperação sem lesão", "Força basal restaurada", "Mobilidade melhorada"],
            rewards: ["Título: The Resilient", "+1500 XP", "Badge: Return Champion"]),
    ];

    private record SagaTemplate(
        string Type, string Name, string Description, int DurationDays,
        string[] Goals, string[] Rewards);
}

// ─── DTOs ─────────────────────────────────────────────────────────────────────

public record OnboardingDto(Dictionary<string, string> Answers);
public record ChatMessageDto(string Message);
public record CheckinAnswerDto(Guid CheckinId, Dictionary<string, string> Answers);
public record UserGoalDto(string GoalType, string GoalDescription, decimal? TargetValue, decimal? CurrentValue, string? Unit);
public record UpdateGoalDto(decimal CurrentValue);
