using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FitnessTrack.Application.DTOs;
using FitnessTrack.Application.Services;
using FitnessTrack.Infrastructure.Data;
using FitnessTrack.Core.Entities;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace FitnessTrack.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class WorkoutController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IXpCalculatorService _xpCalc;
    private readonly IMuscleRankService _muscleRank;
    private readonly IStreakService _streak;
    private readonly IHunterProgressService _hunterProgress;
    private readonly ISkillDetectionService _skillDetection;

    public WorkoutController(
        AppDbContext db,
        IXpCalculatorService xpCalc,
        IMuscleRankService muscleRank,
        IStreakService streak,
        IHunterProgressService hunterProgress,
        ISkillDetectionService skillDetection)
    {
        _db = db;
        _xpCalc = xpCalc;
        _muscleRank = muscleRank;
        _streak = streak;
        _hunterProgress = hunterProgress;
        _skillDetection = skillDetection;
    }

    private Guid UserId =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // ─── Plans ───────────────────────────────────────────────────────────

    /// <summary>GET /api/workout/plans — Lista planos do usuário</summary>
    [HttpGet("plans")]
    public async Task<IActionResult> GetPlans()
    {
        var plans = await _db.WorkoutPlans
            .Where(p => p.UserId == UserId)
            .Include(p => p.Days)
            .ThenInclude(d => d.Exercises)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();

        return Ok(plans);
    }

    /// <summary>POST /api/workout/plans — Cria plano</summary>
    [HttpPost("plans")]
    public async Task<IActionResult> CreatePlan([FromBody] CreatePlanDto dto)
    {
        var plan = new WorkoutPlan
        {
            Id = Guid.NewGuid(),
            UserId = UserId,
            Name = dto.Name,
            RawTxt = dto.RawTxt,
            CreatedAt = DateTime.UtcNow,
        };

        _db.WorkoutPlans.Add(plan);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetPlans), new { }, plan);
    }

    // ─── Sessions ─────────────────────────────────────────────────────────

    /// <summary>POST /api/workout/sessions — Inicia sessão</summary>
    [HttpPost("sessions")]
    public async Task<IActionResult> StartSession([FromBody] StartSessionDto dto)
    {
        var session = new WorkoutSession
        {
            Id = Guid.NewGuid(),
            UserId = UserId,
            DayId = dto.DayId,
            SessionDate = DateOnly.FromDateTime(DateTime.UtcNow),
            StartedAt = DateTime.UtcNow,
            SyncStatus = "synced",
            DungeonType = dto.DungeonType ?? "normal",
        };

        _db.WorkoutSessions.Add(session);
        await _db.SaveChangesAsync();
        return Ok(new { sessionId = session.Id });
    }

    /// <summary>POST /api/workout/sessions/{id}/sets — Registra série</summary>
    [HttpPost("sessions/{sessionId}/sets")]
    public async Task<IActionResult> LogSet(Guid sessionId, [FromBody] LogSetDto dto)
    {
        var session = await _db.WorkoutSessions
            .FirstOrDefaultAsync(s => s.Id == sessionId && s.UserId == UserId);

        if (session == null) return NotFound();

        var set = new ExerciseSet
        {
            Id = Guid.NewGuid(),
            SessionId = sessionId,
            ExerciseId = dto.ExerciseId,
            SetNumber = dto.SetNumber,
            WeightKg = dto.WeightKg,
            RepsDone = dto.RepsDone,
            Completed = true,
            CompletedAt = DateTime.UtcNow,
            SetType = dto.SetType ?? "normal",
            Rpe = dto.Rpe,
        };

        _db.ExerciseSets.Add(set);
        await _db.SaveChangesAsync();

        return Ok(new
        {
            setId = set.Id,
            volumeLoad = dto.WeightKg * dto.RepsDone,
        });
    }

    /// <summary>POST /api/workout/sessions/{id}/finish — Finaliza sessão e calcula XP</summary>
    [HttpPost("sessions/{sessionId}/finish")]
    public async Task<IActionResult> FinishSession(Guid sessionId)
    {
        var session = await _db.WorkoutSessions
            .Include(s => s.Sets)
            .ThenInclude(s => s.Exercise)
            .FirstOrDefaultAsync(s => s.Id == sessionId && s.UserId == UserId);

        if (session == null) return NotFound();

        // Buscar skills ativas de XP do usuário para o cálculo de multiplicador
        var activeXpSkills = await _db.HunterSkills
            .Where(s => s.UserId == UserId && s.IsActive && s.EffectType == "xp_multiplier")
            .ToListAsync();

        using var transaction = await _db.Database.BeginTransactionAsync();
        try
        {
            session.FinishedAt = DateTime.UtcNow;
            // Proteção contra StartedAt nulo (sessão iniciada offline sem registro do início)
            session.TotalDurationSeconds = session.StartedAt.HasValue
                ? (int)(session.FinishedAt.Value - session.StartedAt.Value).TotalSeconds
                : 0;
            session.TotalVolumeLoadKg = session.Sets.Sum(s => s.WeightKg.HasValue && s.RepsDone.HasValue
                ? s.WeightKg.Value * s.RepsDone.Value
                : 0);
            session.DungeonCleared = true;

            // Calcular XP (inclui multiplicadores de skill)
            var xpResult = await _xpCalc.CalculateSessionXpAsync(session, activeXpSkills);
            session.XpEarned = xpResult.TotalXp;
            session.XpMultiplier = (decimal)xpResult.Multiplier;

            // Atualizar ranks musculares
            await _muscleRank.UpdateAfterSessionAsync(session);

            // Atualizar streak de treino
            await _streak.UpdateWorkoutStreakAsync(UserId, DateOnly.FromDateTime(DateTime.UtcNow));

            // Level up / rank up
            var levelResult = await _hunterProgress.AddXpAsync(UserId, xpResult.TotalXp);

            await _db.SaveChangesAsync();
            await transaction.CommitAsync();

            // Detect and unlock any newly earned real skills (fire-and-forget pattern: errors don't fail the response)
            var newSkills = new List<string>();
            try { newSkills = (await _skillDetection.CheckAndUnlockSkillsAsync(UserId)).ToList(); }
            catch { /* skill detection is non-critical */ }

            return Ok(new
            {
                sessionId = session.Id,
                durationSeconds = session.TotalDurationSeconds,
                volumeLoadKg = session.TotalVolumeLoadKg,
                xpEarned = session.XpEarned,
                xpBreakdown = xpResult.Breakdown,
                levelResult,
                newSkillsUnlocked = newSkills,
            });
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    /// <summary>GET /api/workout/history — Histórico paginado</summary>
    [HttpGet("history")]
    public async Task<IActionResult> GetHistory([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var sessions = await _db.WorkoutSessions
            .Include(s => s.Day)
            .Where(s => s.UserId == UserId)
            .OrderByDescending(s => s.SessionDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(s => new
            {
                s.Id,
                s.SessionDate,
                DayLabel           = s.Day.DayLabel,
                s.DungeonType,
                s.TotalDurationSeconds,
                s.TotalVolumeLoadKg,
                s.XpEarned,
                s.DungeonCleared,
                s.PrBeaten,
            })
            .ToListAsync();

        var total = await _db.WorkoutSessions.CountAsync(s => s.UserId == UserId);

        return Ok(new { sessions, total, page, pageSize });
    }

    // ─── GET /api/workout/today ────────────────────────────────────────────

    /// <summary>
    /// Retorna o treino do dia atual com exercícios e carga da última sessão de cada exercício.
    /// Usado para o cache offline (Dexie.js).
    /// </summary>
    [HttpGet("today")]
    public async Task<IActionResult> GetToday()
    {
        var userId = UserId;
        var today  = DateOnly.FromDateTime(DateTime.UtcNow);

        // Dia da semana (1=Dom, 2=Seg ... 7=Sáb) → mapeia para day_number
        int dayOfWeek = (int)DateTime.UtcNow.DayOfWeek + 1;

        // Pega o último plano ativo do usuário
        var plan = await _db.WorkoutPlans
            .Include(p => p.Days)
            .ThenInclude(d => d.Exercises)
            .ThenInclude(e => e.Alternatives)
            .Where(p => p.UserId == userId)
            .OrderByDescending(p => p.CreatedAt)
            .FirstOrDefaultAsync();

        if (plan == null) return NotFound(new { error = "Nenhum plano de treino encontrado" });

        // Dia correspondente ao dia da semana
        var day = plan.Days.FirstOrDefault(d => d.DayNumber == dayOfWeek)
               ?? plan.Days.OrderBy(d => d.DayNumber).First();

        // Para cada exercício, busca dados da última sessão
        var exerciseIds = day.Exercises.Select(e => e.Id).ToList();

        var lastSessionData = new Dictionary<Guid, object?>();
        foreach (var exId in exerciseIds)
        {
            var lastSession = await _db.WorkoutSessions
                .Where(s => s.UserId == userId && s.DungeonCleared == true)
                .OrderByDescending(s => s.SessionDate)
                .FirstOrDefaultAsync(s => s.Sets.Any(set => set.ExerciseId == exId));

            if (lastSession != null)
            {
                var sets = await _db.ExerciseSets
                    .Where(s => s.SessionId == lastSession.Id && s.ExerciseId == exId && s.Completed)
                    .OrderBy(s => s.SetNumber)
                    .Select(s => new { s.SetNumber, s.WeightKg, s.RepsDone })
                    .ToListAsync();

                lastSessionData[exId] = new
                {
                    date = lastSession.SessionDate,
                    sets,
                };
            }
            else
            {
                lastSessionData[exId] = null;
            }
        }

        var exercises = day.Exercises.Select(e => new
        {
            e.Id,
            e.Name,
            e.Sets,
            e.Reps,
            e.RestSeconds,
            e.GifUrl,
            e.Notes,
            e.OrderIndex,
            e.PrimaryMuscleGroup,
            alternatives = e.Alternatives.Select(a => new
            {
                a.AlternativeName,
                a.SimilarityScore,
                a.EquipmentRequired,
            }),
            lastSession = lastSessionData.TryGetValue(e.Id, out var ls) ? ls : null,
        });

        return Ok(new
        {
            planId    = plan.Id,
            planName  = plan.Name,
            dayId     = day.Id,
            dayNumber = day.DayNumber,
            dayLabel  = day.DayLabel,
            muscleGroups = day.MuscleGroups,
            isRestDay = day.IsRestDay,
            cardioRequired    = day.CardioRequired,
            cardioMinMinutes  = day.CardioMinMinutes,
            exercises,
        });
    }

    // ─── GET /api/workout/days/{dayId} — Retorna dados de um dia específico ──

    /// <summary>
    /// Retorna exercícios e dados da última sessão para um dia específico pelo ID.
    /// Usado quando o usuário navega para um dia que não é o de hoje.
    /// </summary>
    [HttpGet("days/{dayId:guid}")]
    public async Task<IActionResult> GetDay(Guid dayId)
    {
        var userId = UserId;

        var day = await _db.WorkoutDays
            .Include(d => d.Exercises)
                .ThenInclude(e => e.Alternatives)
            .Include(d => d.Plan)
            .FirstOrDefaultAsync(d => d.Id == dayId && d.Plan.UserId == userId);

        if (day == null) return NotFound(new { error = "Dia de treino não encontrado" });

        var exerciseIds = day.Exercises.Select(e => e.Id).ToList();
        var lastSessionData = new Dictionary<Guid, object?>();

        foreach (var exId in exerciseIds)
        {
            var lastSession = await _db.WorkoutSessions
                .Where(s => s.UserId == userId && s.DungeonCleared == true)
                .OrderByDescending(s => s.SessionDate)
                .FirstOrDefaultAsync(s => s.Sets.Any(set => set.ExerciseId == exId));

            if (lastSession != null)
            {
                var sets = await _db.ExerciseSets
                    .Where(s => s.SessionId == lastSession.Id && s.ExerciseId == exId && s.Completed)
                    .OrderBy(s => s.SetNumber)
                    .Select(s => new { s.SetNumber, s.WeightKg, s.RepsDone })
                    .ToListAsync();

                lastSessionData[exId] = new { date = lastSession.SessionDate, sets };
            }
            else
            {
                lastSessionData[exId] = null;
            }
        }

        var exercises = day.Exercises.OrderBy(e => e.OrderIndex).Select(e => new
        {
            e.Id, e.Name, e.Sets, e.Reps, e.RestSeconds, e.GifUrl, e.Notes,
            e.OrderIndex, e.PrimaryMuscleGroup,
            alternatives = e.Alternatives.Select(a => new
            {
                a.AlternativeName, a.SimilarityScore, a.EquipmentRequired,
            }),
            lastSession = lastSessionData.TryGetValue(e.Id, out var ls) ? ls : null,
        });

        return Ok(new
        {
            planId       = day.PlanId,
            planName     = day.Plan.Name,
            dayId        = day.Id,
            dayNumber    = day.DayNumber,
            dayLabel     = day.DayLabel,
            muscleGroups = day.MuscleGroups,
            isRestDay    = day.IsRestDay,
            cardioRequired   = day.CardioRequired,
            cardioMinMinutes = day.CardioMinMinutes,
            exercises,
        });
    }

    // ─── POST /api/workout/sessions/sync — Sync idempotente em lote ──────

    /// <summary>
    /// Recebe uma lista de séries pendentes (offline) e persiste de forma idempotente.
    /// Ignora séries já persistidas (mesmo SetNumber + SessionId + ExerciseId).
    /// </summary>
    [HttpPost("sessions/sync")]
    public async Task<IActionResult> SyncSets([FromBody] SyncSetsDto dto)
    {
        if (dto.Sets == null || !dto.Sets.Any())
            return Ok(new { synced = 0, skipped = 0 });

        int synced  = 0;
        int skipped = 0;

        foreach (var s in dto.Sets)
        {
            // Verifica se sessão pertence ao usuário
            var sessionExists = await _db.WorkoutSessions
                .AnyAsync(ws => ws.Id == s.SessionId && ws.UserId == UserId);

            if (!sessionExists) continue;

            // Idempotência: não duplicar se já existe
            var exists = await _db.ExerciseSets
                .AnyAsync(es => es.SessionId == s.SessionId
                             && es.ExerciseId == s.ExerciseId
                             && es.SetNumber == s.SetNumber);

            if (exists) { skipped++; continue; }

            _db.ExerciseSets.Add(new Core.Entities.ExerciseSet
            {
                Id          = Guid.NewGuid(),
                SessionId   = s.SessionId,
                ExerciseId  = s.ExerciseId,
                SetNumber   = s.SetNumber,
                WeightKg    = s.WeightKg,
                RepsDone    = s.RepsDone,
                Completed   = true,
                CompletedAt = s.CompletedAt ?? DateTime.UtcNow,
            });
            synced++;
        }

        await _db.SaveChangesAsync();
        return Ok(new { synced, skipped });
    }
}

public record SyncSetsDto(List<SyncSetItem>? Sets);
public record SyncSetItem(
    Guid SessionId,
    Guid ExerciseId,
    int SetNumber,
    decimal? WeightKg,
    int? RepsDone,
    DateTime? CompletedAt
);
