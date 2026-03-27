using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FitnessTrack.Application.Services;
using FitnessTrack.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace FitnessTrack.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ImportController : ControllerBase
{
    private readonly IWorkoutParserService _workoutParser;
    private readonly IDietParserService _dietParser;
    private readonly AppDbContext _db;

    public ImportController(
        IWorkoutParserService workoutParser,
        IDietParserService dietParser,
        AppDbContext db)
    {
        _workoutParser = workoutParser;
        _dietParser = dietParser;
        _db = db;
    }

    private Guid UserId =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // ─── POST /api/import/workout ─────────────────────────────────────────
    /// <summary>
    /// Parseia um TXT de plano de treino e persiste no banco.
    /// Spec: Módulo A — Parser TXT (seção 5)
    /// </summary>
    [HttpPost("workout")]
    [RequestSizeLimit(512 * 1024)] // 512 KB — plano TXT nunca deve ultrapassar isso
    public async Task<IActionResult> ImportWorkout([FromBody] ImportWorkoutDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.RawTxt))
            return Ok(new { days = 0, exercises = 0, ignoredLines = 0 });

        // Valida tamanho do texto diretamente (defesa em profundidade)
        if (dto.RawTxt.Length > 200_000)
            return BadRequest(new { error = "Plano muito longo. Máximo de 200.000 caracteres." });

        var plan = _workoutParser.Parse(dto.RawTxt, UserId);

        if (!string.IsNullOrEmpty(dto.Name))
            plan.Name = dto.Name;

        _db.WorkoutPlans.Add(plan);
        await _db.SaveChangesAsync();

        var totalExercises = plan.Days.Sum(d => d.Exercises.Count);
        return Ok(new
        {
            planId = plan.Id,
            name = plan.Name,
            days = plan.Days.Count,
            exercises = totalExercises,
        });
    }

    // ─── POST /api/import/workout/preview ─────────────────────────────────
    /// <summary>
    /// Parseia e retorna o preview sem persistir.
    /// Usado pelo frontend para o pré-visualizar.
    /// </summary>
    [HttpPost("workout/preview")]
    [RequestSizeLimit(512 * 1024)]
    public IActionResult PreviewWorkout([FromBody] ImportWorkoutDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.RawTxt))
            return Ok(new { days = new object[0] });

        if (dto.RawTxt.Length > 200_000)
            return BadRequest(new { error = "Plano muito longo. Máximo de 200.000 caracteres." });

        var plan = _workoutParser.Parse(dto.RawTxt, UserId);

        var preview = plan.Days.Select(d => new
        {
            dayNumber = d.DayNumber,
            dayLabel = d.DayLabel,
            muscleGroups = d.MuscleGroups,
            isRestDay = d.IsRestDay,
            exercises = d.Exercises.Select(e => new
            {
                name = e.Name,
                sets = e.Sets,
                reps = e.Reps,
                restSeconds = e.RestSeconds,
                primaryMuscleGroup = e.PrimaryMuscleGroup,
            }),
        });

        return Ok(new { name = plan.Name, days = preview });
    }

    // ─── POST /api/import/diet/preview ───────────────────────────────────
    /// <summary>
    /// Parseia e retorna preview das refeições sem persistir.
    /// </summary>
    [HttpPost("diet/preview")]
    [RequestSizeLimit(256 * 1024)]
    public IActionResult PreviewDiet([FromBody] ImportDietDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.RawTxt))
            return Ok(new { meals = new object[0] });

        if (dto.RawTxt.Length > 100_000)
            return BadRequest(new { error = "Plano muito longo. Máximo de 100.000 caracteres." });

        var result = _dietParser.Parse(dto.RawTxt);

        return Ok(new
        {
            meals = result.Meals.Select(m => new
            {
                number        = m.MealNumber,
                name          = m.Name,
                suggestedTime = m.SuggestedTime,
                kcal          = m.KcalEstimate,
                proteinG      = m.ProteinG,
                carbsG        = m.CarbsG,
                fatG          = m.FatG,
                foods         = m.Foods,
            }),
            totals = new
            {
                kcal     = result.TotalKcal,
                proteinG = result.TotalProteinG,
                carbsG   = result.TotalCarbsG,
                fatG     = result.TotalFatG,
            },
            macrosSumValid = result.MacrosSumValid,
            ignoredLines   = result.IgnoredLines,
        });
    }

    // ─── POST /api/import/diet ────────────────────────────────────────────
    /// <summary>
    /// Parseia plano alimentar e persiste como NutritionLogs (source=import).
    /// Spec: PD-01 a PD-03 (seção 5).
    /// </summary>
    [HttpPost("diet")]
    [RequestSizeLimit(256 * 1024)]
    public async Task<IActionResult> ImportDiet([FromBody] ImportDietDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.RawTxt))
            return BadRequest(new { error = "Texto vazio" });

        if (dto.RawTxt.Length > 100_000)
            return BadRequest(new { error = "Plano alimentar muito longo. Máximo de 100.000 caracteres." });

        var result = _dietParser.Parse(dto.RawTxt);

        if (result.Meals.Count == 0)
            return BadRequest(new { error = "Nenhuma refeição reconhecida. Verifique o formato do texto." });

        var logs = _dietParser.ToNutritionLogs(result, UserId);
        _db.NutritionLogs.AddRange(logs);

        // Atualiza metas diárias no perfil do hunter se o total foi reconhecido
        if (result.TotalKcal > 0)
        {
            var profile = await _db.HunterProfiles
                .FirstOrDefaultAsync(p => p.UserId == UserId);
            if (profile is not null)
            {
                profile.DailyKcalTarget    = result.TotalKcal;
                profile.DailyProteinGTarget = result.TotalProteinG;
                profile.DailyCarbsGTarget   = result.TotalCarbsG;
                profile.DailyFatGTarget     = result.TotalFatG;
            }
        }

        await _db.SaveChangesAsync();

        return Ok(new
        {
            meals         = result.Meals.Count,
            totalKcal     = result.TotalKcal,
            totalProteinG = result.TotalProteinG,
            totalCarbsG   = result.TotalCarbsG,
            totalFatG     = result.TotalFatG,
            macrosSumValid = result.MacrosSumValid,
        });
    }
}

public record ImportWorkoutDto(string RawTxt, string? Name = null);
public record ImportDietDto(string RawTxt);
