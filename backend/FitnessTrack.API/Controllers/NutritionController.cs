using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FitnessTrack.Application.Services;
using FitnessTrack.Infrastructure.Data;
using FitnessTrack.Core.Entities;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;

namespace FitnessTrack.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NutritionController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IHunterProgressService _hunterProgress;

    public NutritionController(AppDbContext db, IHunterProgressService hunterProgress)
    {
        _db = db;
        _hunterProgress = hunterProgress;
    }

    private Guid UserId =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // ─── GET /api/nutrition/today ─────────────────────────────────────────
    /// <summary>
    /// Retorna o log de nutrição de hoje + metas do usuário.
    /// </summary>
    [HttpGet("today")]
    public async Task<IActionResult> GetToday()
    {
        var today = DateTime.UtcNow.Date;
        var userId = UserId;

        var logs = await _db.NutritionLogs
            .Where(n => n.UserId == userId && n.LoggedAt.Date == today)
            .OrderBy(n => n.LoggedAt)
            .ToListAsync();

        var profile = await _db.HunterProfiles
            .FirstOrDefaultAsync(p => p.UserId == userId);

        // Agrega totais do dia
        var totals = new
        {
            kcalConsumed  = logs.Sum(l => l.KcalConsumed),
            proteinG      = logs.Sum(l => l.ProteinG),
            carbsG        = logs.Sum(l => l.CarbsG),
            fatG          = logs.Sum(l => l.FatG),
            waterMl       = logs.Sum(l => l.WaterMl),
        };

        // Metas — usam o perfil do hunter ou defaults razoáveis
        var targets = new
        {
            kcal      = profile?.DailyKcalTarget      ?? 2450,
            proteinG  = profile?.DailyProteinGTarget  ?? 180,
            carbsG    = profile?.DailyCarbsGTarget     ?? 220,
            fatG      = profile?.DailyFatGTarget       ?? 70,
            waterMl   = profile?.DailyWaterMlTarget    ?? 3500,
        };

        var meals = logs
            .Where(l => l.WaterMl == 0) // Registros de comida
            .Select(l => new
            {
                id        = l.Id,
                name      = l.MealName,
                time      = l.LoggedAt.ToString("HH:mm"),
                kcal      = l.KcalConsumed,
                proteinG  = l.ProteinG,
                carbsG    = l.CarbsG,
                fatG      = l.FatG,
            });

        return Ok(new { totals, targets, meals });
    }

    // ─── POST /api/nutrition/log ──────────────────────────────────────────
    /// <summary>
    /// Registra uma refeição / entrada de macro.
    /// </summary>
    [HttpPost("log")]
    public async Task<IActionResult> LogMeal([FromBody] LogMealDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.MealName))
            return BadRequest(new { error = "Nome da refeição é obrigatório" });

        var log = new NutritionLog
        {
            Id           = Guid.NewGuid(),
            UserId       = UserId,
            MealName     = dto.MealName,
            KcalConsumed = dto.KcalConsumed,
            ProteinG     = dto.ProteinG,
            CarbsG       = dto.CarbsG,
            FatG         = dto.FatG,
            WaterMl      = 0,
            Source       = dto.Source ?? "manual",
            LoggedAt     = DateTime.UtcNow,
        };

        _db.NutritionLogs.Add(log);
        await _db.SaveChangesAsync();

        return Ok(new
        {
            id       = log.Id,
            mealName = log.MealName,
            kcal     = log.KcalConsumed,
            loggedAt = log.LoggedAt,
        });
    }

    // ─── DELETE /api/nutrition/log/{id} ──────────────────────────────────
    [HttpDelete("log/{id:guid}")]
    public async Task<IActionResult> DeleteLog(Guid id)
    {
        var log = await _db.NutritionLogs
            .FirstOrDefaultAsync(l => l.Id == id && l.UserId == UserId);

        if (log is null) return NotFound();

        _db.NutritionLogs.Remove(log);
        await _db.SaveChangesAsync();

        return NoContent();
    }

    // ─── POST /api/nutrition/water ────────────────────────────────────────
    /// <summary>
    /// Registra um evento de hidratação (incremento em ml).
    /// </summary>
    [HttpPost("water")]
    public async Task<IActionResult> LogWater([FromBody] LogWaterDto dto)
    {
        if (dto.AmountMl <= 0)
            return BadRequest(new { error = "Quantidade deve ser positiva" });

        var log = new NutritionLog
        {
            Id           = Guid.NewGuid(),
            UserId       = UserId,
            MealName     = "Água",
            KcalConsumed = 0,
            ProteinG     = 0,
            CarbsG       = 0,
            FatG         = 0,
            WaterMl      = dto.AmountMl,
            Source       = "manual",
            LoggedAt     = DateTime.UtcNow,
        };

        _db.NutritionLogs.Add(log);
        await _db.SaveChangesAsync();

        // Total de água hoje
        var today = DateTime.UtcNow.Date;
        var totalWaterToday = await _db.NutritionLogs
            .Where(l => l.UserId == UserId && l.LoggedAt.Date == today)
            .SumAsync(l => l.WaterMl);

        return Ok(new
        {
            logId         = log.Id,
            addedMl       = dto.AmountMl,
            totalTodayMl  = totalWaterToday,
        });
    }

    // ─── GET /api/nutrition/history ───────────────────────────────────────
    /// <summary>
    /// Retorna histórico agregado por dia (últimos N dias).
    /// </summary>
    [HttpGet("history")]
    public async Task<IActionResult> GetHistory([FromQuery] int days = 30)
    {
        var userId = UserId;
        var from = DateTime.UtcNow.Date.AddDays(-days);

        var logs = await _db.NutritionLogs
            .Where(l => l.UserId == userId && l.LoggedAt.Date >= from)
            .ToListAsync();

        var grouped = logs
            .GroupBy(l => l.LoggedAt.Date)
            .Select(g => new
            {
                date      = g.Key.ToString("yyyy-MM-dd"),
                kcal      = g.Sum(l => l.KcalConsumed),
                proteinG  = g.Sum(l => l.ProteinG),
                carbsG    = g.Sum(l => l.CarbsG),
                fatG      = g.Sum(l => l.FatG),
                waterMl   = g.Sum(l => l.WaterMl),
            })
            .OrderBy(g => g.date);

        return Ok(new { days = grouped });
    }

    // ─── GET /api/nutrition/targets ──────────────────────────────────────
    [HttpGet("targets")]
    public async Task<IActionResult> GetTargets()
    {
        var profile = await _db.HunterProfiles
            .FirstOrDefaultAsync(p => p.UserId == UserId);

        return Ok(new
        {
            kcal      = profile?.DailyKcalTarget      ?? 2450,
            proteinG  = profile?.DailyProteinGTarget  ?? 180,
            carbsG    = profile?.DailyCarbsGTarget     ?? 220,
            fatG      = profile?.DailyFatGTarget       ?? 70,
            waterMl   = profile?.DailyWaterMlTarget    ?? 3500,
        });
    }

    // ─── PUT /api/nutrition/targets ──────────────────────────────────────
    [HttpPut("targets")]
    public async Task<IActionResult> UpdateTargets([FromBody] UpdateTargetsDto dto)
    {
        var profile = await _db.HunterProfiles
            .FirstOrDefaultAsync(p => p.UserId == UserId);

        if (profile is null) return NotFound();

        if (dto.Kcal.HasValue)     profile.DailyKcalTarget     = dto.Kcal.Value;
        if (dto.ProteinG.HasValue) profile.DailyProteinGTarget = dto.ProteinG.Value;
        if (dto.CarbsG.HasValue)   profile.DailyCarbsGTarget   = dto.CarbsG.Value;
        if (dto.FatG.HasValue)     profile.DailyFatGTarget     = dto.FatG.Value;
        if (dto.WaterMl.HasValue)  profile.DailyWaterMlTarget  = dto.WaterMl.Value;

        await _db.SaveChangesAsync();
        return Ok(new { message = "Metas atualizadas" });
    }
}

// ─── DTOs ────────────────────────────────────────────────────────────────────
public record LogMealDto(
    string MealName,
    int KcalConsumed,
    float ProteinG,
    float CarbsG,
    float FatG,
    string? Source = "manual"
);

public record LogWaterDto(int AmountMl);

public record UpdateTargetsDto(
    int? Kcal,
    float? ProteinG,
    float? CarbsG,
    float? FatG,
    int? WaterMl
);
