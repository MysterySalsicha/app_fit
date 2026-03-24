using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FitnessTrack.Application.Services;
using FitnessTrack.Infrastructure.Data;
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
    public async Task<IActionResult> ImportWorkout([FromBody] ImportWorkoutDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.RawTxt))
            return Ok(new { days = 0, exercises = 0, ignoredLines = 0 });

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
    public IActionResult PreviewWorkout([FromBody] ImportWorkoutDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.RawTxt))
            return Ok(new { days = new object[0] });

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

    // ─── POST /api/import/diet ────────────────────────────────────────────
    [HttpPost("diet")]
    public async Task<IActionResult> ImportDiet([FromBody] ImportDietDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.RawTxt))
            return BadRequest(new { error = "Texto vazio" });

        // TODO: DietParserService completo (spec seção 5, PD-01 a PD-03)
        return Ok(new { message = "Diet parser em implementação" });
    }
}

public record ImportWorkoutDto(string RawTxt, string? Name = null);
public record ImportDietDto(string RawTxt);
