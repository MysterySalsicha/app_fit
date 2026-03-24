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
public class BodyController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IBodyAlertService _alertService;

    public BodyController(AppDbContext db, IBodyAlertService alertService)
    {
        _db = db;
        _alertService = alertService;
    }

    private Guid UserId =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // ─── GET /api/body/history ────────────────────────────────────────────
    /// <summary>
    /// Retorna histórico de medições + dados para os gráficos Recharts.
    /// </summary>
    [HttpGet("history")]
    public async Task<IActionResult> GetHistory([FromQuery] int days = 90)
    {
        var from = DateTime.UtcNow.AddDays(-days);
        var userId = UserId;

        var measurements = await _db.BodyMeasurements
            .Where(b => b.UserId == userId && b.MeasuredAt >= from)
            .OrderBy(b => b.MeasuredAt)
            .ToListAsync();

        var chartData = measurements.Select(m => new
        {
            date         = m.MeasuredAt.ToString("yyyy-MM-dd"),
            weightKg     = m.WeightKg,
            bodyFatPct   = m.BodyFatPct,
            muscleMassKg = m.MuscleMassKg,
            waterPct     = m.WaterPct,
            waistCm      = m.WaistCm,
        });

        // Estatísticas rápidas
        var latest = measurements.LastOrDefault();
        var first  = measurements.FirstOrDefault();

        object? stats = null;
        if (latest is not null && first is not null && measurements.Count > 1)
        {
            stats = new
            {
                weightDelta     = latest.WeightKg     - first.WeightKg,
                bodyFatDelta    = latest.BodyFatPct   - first.BodyFatPct,
                muscleDelta     = latest.MuscleMassKg - first.MuscleMassKg,
                periodDays      = (latest.MeasuredAt - first.MeasuredAt).TotalDays,
            };
        }

        return Ok(new
        {
            measurements = chartData,
            latest       = latest is null ? null : MapMeasurement(latest),
            stats,
        });
    }

    // ─── GET /api/body/latest ─────────────────────────────────────────────
    [HttpGet("latest")]
    public async Task<IActionResult> GetLatest()
    {
        var m = await _db.BodyMeasurements
            .Where(b => b.UserId == UserId)
            .OrderByDescending(b => b.MeasuredAt)
            .FirstOrDefaultAsync();

        if (m is null) return Ok(null);
        return Ok(MapMeasurement(m));
    }

    // ─── POST /api/body ───────────────────────────────────────────────────
    /// <summary>
    /// Registra uma nova medição corporal. Retorna alertas gerados pela análise.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Log([FromBody] LogBodyDto dto)
    {
        var measurement = new BodyMeasurement
        {
            Id               = Guid.NewGuid(),
            UserId           = UserId,
            MeasuredAt       = dto.MeasuredAt ?? DateTime.UtcNow,
            WeightKg         = dto.WeightKg,
            BodyFatPct       = dto.BodyFatPct,
            MuscleMassKg     = dto.MuscleMassKg,
            WaterPct         = dto.WaterPct,
            BoneMassKg       = dto.BoneMassKg,
            VisceralFatLevel = dto.VisceralFatLevel,
            Bmi              = dto.Bmi ?? (dto.WeightKg.HasValue && dto.HeightCm.HasValue
                                   ? Math.Round(dto.WeightKg.Value / (decimal)Math.Pow((double)(dto.HeightCm.Value / 100), 2), 1)
                                   : null),
            BasalMetabolicRate = dto.BasalMetabolicRate,
            WaistCm          = dto.WaistCm,
            ChestCm          = dto.ChestCm,
            HipCm            = dto.HipCm,
            ArmCm            = dto.ArmCm,
            Source           = dto.Source ?? "manual",
            Notes            = dto.Notes,
            AiValidated      = dto.AiValidated,
            AiRawJson        = dto.AiRawJson,
        };

        _db.BodyMeasurements.Add(measurement);
        await _db.SaveChangesAsync();

        // Analisa e retorna alertas
        var alerts = await _alertService.AnalyzeAsync(UserId, measurement);

        return Ok(new
        {
            id         = measurement.Id,
            measuredAt = measurement.MeasuredAt,
            alerts,
        });
    }

    // ─── DELETE /api/body/{id} ────────────────────────────────────────────
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var m = await _db.BodyMeasurements
            .FirstOrDefaultAsync(b => b.Id == id && b.UserId == UserId);
        if (m is null) return NotFound();

        _db.BodyMeasurements.Remove(m);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ─── Helper ───────────────────────────────────────────────────────────
    private static object MapMeasurement(BodyMeasurement m) => new
    {
        id               = m.Id,
        measuredAt       = m.MeasuredAt,
        weightKg         = m.WeightKg,
        bodyFatPct       = m.BodyFatPct,
        muscleMassKg     = m.MuscleMassKg,
        waterPct         = m.WaterPct,
        boneMassKg       = m.BoneMassKg,
        visceralFatLevel = m.VisceralFatLevel,
        bmi              = m.Bmi,
        basalMetabolicRate = m.BasalMetabolicRate,
        waistCm          = m.WaistCm,
        chestCm          = m.ChestCm,
        hipCm            = m.HipCm,
        armCm            = m.ArmCm,
        source           = m.Source,
        notes            = m.Notes,
        aiValidated      = m.AiValidated,
    };
}

// ─── DTOs ─────────────────────────────────────────────────────────────────────
public record LogBodyDto(
    DateTime? MeasuredAt,
    decimal? WeightKg,
    decimal? BodyFatPct,
    decimal? MuscleMassKg,
    decimal? WaterPct,
    decimal? BoneMassKg,
    decimal? VisceralFatLevel,
    decimal? Bmi,
    decimal? HeightCm,            // Para calcular BMI se não fornecido
    decimal? BasalMetabolicRate,
    decimal? WaistCm,
    decimal? ChestCm,
    decimal? HipCm,
    decimal? ArmCm,
    string? Source,
    string? Notes,
    bool AiValidated = false,
    string? AiRawJson = null
);
