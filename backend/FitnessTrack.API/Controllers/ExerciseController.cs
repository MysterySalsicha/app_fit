using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FitnessTrack.Infrastructure.Data;
using FitnessTrack.Core.Entities;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace FitnessTrack.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ExerciseController : ControllerBase
{
    private readonly AppDbContext _db;

    public ExerciseController(AppDbContext db) => _db = db;

    private Guid UserId =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // ─── GET /api/exercise/{exerciseId}/last-session ──────────────────────
    /// <summary>
    /// Retorna dados da última sessão do exercício — exibido como histórico inline no ExerciseCard.
    /// </summary>
    [HttpGet("{exerciseId:guid}/last-session")]
    public async Task<IActionResult> GetLastSession(Guid exerciseId)
    {
        // Última sessão do usuário que contém este exercício
        var lastSession = await _db.WorkoutSessions
            .Where(s => s.UserId == UserId && s.DungeonCleared == true)
            .OrderByDescending(s => s.SessionDate)
            .FirstOrDefaultAsync(s => s.Sets.Any(set => set.ExerciseId == exerciseId));

        if (lastSession == null)
            return Ok(new { lastDate = (DateOnly?)null, sets = Array.Empty<object>() });

        var sets = await _db.ExerciseSets
            .Where(s => s.SessionId == lastSession.Id && s.ExerciseId == exerciseId && s.Completed)
            .OrderBy(s => s.SetNumber)
            .Select(s => new
            {
                setNumber  = s.SetNumber,
                weightKg   = s.WeightKg,
                repsDone   = s.RepsDone,
                volumeLoad = s.VolumeLoadKg,
            })
            .ToListAsync();

        var avgWeight  = sets.Any() ? sets.Where(s => s.weightKg.HasValue).Average(s => s.weightKg) : null;
        var maxWeight  = sets.Any() ? sets.Where(s => s.weightKg.HasValue).Max(s => s.weightKg) : null;

        return Ok(new
        {
            lastDate    = lastSession.SessionDate,
            avgWeightKg = avgWeight.HasValue ? Math.Round(avgWeight.Value, 1) : (decimal?)null,
            maxWeightKg = maxWeight,
            repsSummary = sets.Any()
                ? $"{sets.Count}×{sets.First().repsDone}" +
                  (sets.Count > 1 ? $"–{sets.Last().repsDone}" : "")
                : null,
            sets,
        });
    }

    // ─── GET /api/exercise/{exerciseId}/alternatives ──────────────────────
    /// <summary>
    /// Retorna alternativas de substituição ordenadas por similaridade.
    /// </summary>
    [HttpGet("{exerciseId:guid}/alternatives")]
    public async Task<IActionResult> GetAlternatives(Guid exerciseId)
    {
        var exercise = await _db.Exercises
            .Include(e => e.Alternatives)
            .FirstOrDefaultAsync(e => e.Id == exerciseId);

        if (exercise == null) return NotFound();

        // Buscar PRs do usuário para calcular carga habitual das alternativas
        var altNames = exercise.Alternatives.Select(a => a.AlternativeName).ToList();
        var prs = await _db.ExercisePRs
            .Where(pr => pr.UserId == UserId && altNames.Contains(pr.ExerciseName))
            .ToDictionaryAsync(pr => pr.ExerciseName, pr => pr.MaxWeightKg);

        var result = exercise.Alternatives
            .OrderByDescending(a => a.SimilarityScore)
            .Select(a => new
            {
                name             = a.AlternativeName,
                muscleGroups     = a.MuscleGroups,
                equipment        = a.EquipmentRequired,
                similarityScore  = a.SimilarityScore,
                isGlobal         = a.IsGlobal,
                lastPrKg         = prs.TryGetValue(a.AlternativeName, out var pr) ? pr : null,
            });

        return Ok(result);
    }

    // ─── GET /api/exercise/search?q=&muscle= ──────────────────────────────
    /// <summary>
    /// Busca exercícios por nome (trigram) ou grupo muscular.
    /// </summary>
    [HttpGet("search")]
    public async Task<IActionResult> Search(
        [FromQuery] string? q,
        [FromQuery] string? muscle,
        [FromQuery] int limit = 20)
    {
        var query = _db.Exercises.AsQueryable();

        if (!string.IsNullOrWhiteSpace(q))
            query = query.Where(e => EF.Functions.ILike(e.Name, $"%{q}%"));

        if (!string.IsNullOrWhiteSpace(muscle))
            query = query.Where(e => e.PrimaryMuscleGroup == muscle);

        var results = await query
            .OrderBy(e => e.Name)
            .Take(limit)
            .Select(e => new
            {
                e.Id,
                e.Name,
                e.PrimaryMuscleGroup,
                e.GifUrl,
            })
            .ToListAsync();

        return Ok(results);
    }

    // ─── GET /api/exercise/prs — Personal records do usuário ─────────────
    [HttpGet("prs")]
    public async Task<IActionResult> GetPrs()
    {
        var prs = await _db.ExercisePRs
            .Where(pr => pr.UserId == UserId)
            .OrderBy(pr => pr.ExerciseName)
            .Select(pr => new
            {
                pr.Id,
                pr.ExerciseName,
                pr.ExerciseCategory,
                pr.PrimaryMuscleGroup,
                pr.MaxWeightKg,
                pr.MaxRepsAtMaxWeight,
                pr.MaxVolumeSingleSet,
                pr.MaxRepsBodyweight,
                pr.TimesBeaten,
                pr.LastBeatenAt,
                pr.FirstLoggedAt,
            })
            .ToListAsync();

        return Ok(prs);
    }
}
