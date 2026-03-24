using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FitnessTrack.Application.Services;
using FitnessTrack.Infrastructure.Data;
using FitnessTrack.Core.Entities;
using System.Security.Claims;

namespace FitnessTrack.API.Controllers;

[ApiController]
[Route("api/ai")]
[Authorize]
public class AiVisionController : ControllerBase
{
    private readonly IAiVisionService _aiVision;
    private readonly AppDbContext _db;
    private readonly IBodyAlertService _bodyAlerts;

    public AiVisionController(IAiVisionService aiVision, AppDbContext db, IBodyAlertService bodyAlerts)
    {
        _aiVision   = aiVision;
        _db         = db;
        _bodyAlerts = bodyAlerts;
    }

    private Guid UserId =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // ─── POST /api/ai/body/scan ─────────────────────────────────────────────
    /// <summary>
    /// Extrai dados de bioimpedância de uma imagem via Gemini.
    /// NÃO persiste — retorna para validação no frontend (AiValidationForm).
    /// </summary>
    [HttpPost("body/scan")]
    [RequestSizeLimit(10 * 1024 * 1024)] // 10 MB
    public async Task<IActionResult> ScanBody([FromBody] ImageScanDto dto)
    {
        if (string.IsNullOrEmpty(dto.Base64Image))
            return BadRequest(new { error = "Imagem obrigatória" });

        var result = await _aiVision.ExtractBodyDataAsync(dto.Base64Image, dto.MimeType ?? "image/jpeg");

        return Ok(new
        {
            extracted       = result,
            isValid         = result.IsValid,
            validationWarning = result.ValidationWarning,
        });
    }

    // ─── POST /api/ai/body/confirm ──────────────────────────────────────────
    /// <summary>
    /// Persiste os dados de composição corporal após validação do usuário.
    /// </summary>
    [HttpPost("body/confirm")]
    public async Task<IActionResult> ConfirmBody([FromBody] ConfirmBodyDto dto)
    {
        var measurement = new BodyMeasurement
        {
            Id               = Guid.NewGuid(),
            UserId           = UserId,
            MeasuredAt       = DateTime.UtcNow,
            WeightKg         = dto.WeightKg,
            BodyFatPct       = dto.BodyFatPct,
            MuscleMassKg     = dto.MuscleMassKg,
            WaterPct         = dto.WaterPct,
            BoneMassKg       = dto.BoneMassKg,
            VisceralFatLevel = dto.VisceralFatLevel,
            Bmi              = dto.Bmi,
            BasalMetabolicRate = dto.BasalMetabolicRate,
            WaistCm          = dto.WaistCm,
            Source           = "ai_vision",
            Notes            = dto.Notes,
            AiValidated      = true,
            AiRawJson        = dto.RawJson,
        };

        _db.BodyMeasurements.Add(measurement);
        await _db.SaveChangesAsync();

        var alerts = await _bodyAlerts.AnalyzeAsync(UserId, measurement);

        return Ok(new { id = measurement.Id, alerts });
    }

    // ─── POST /api/ai/nutrition/scan ────────────────────────────────────────
    /// <summary>
    /// Extrai macros de uma foto de rótulo/alimento via Gemini.
    /// NÃO persiste — retorna para validação no frontend.
    /// </summary>
    [HttpPost("nutrition/scan")]
    [RequestSizeLimit(10 * 1024 * 1024)]
    public async Task<IActionResult> ScanNutrition([FromBody] ImageScanDto dto)
    {
        if (string.IsNullOrEmpty(dto.Base64Image))
            return BadRequest(new { error = "Imagem obrigatória" });

        var result = await _aiVision.ExtractNutritionDataAsync(dto.Base64Image, dto.MimeType ?? "image/jpeg");

        return Ok(new
        {
            extracted         = result,
            isValid           = result.IsValid,
            validationWarning = result.ValidationWarning,
        });
    }

    // ─── POST /api/ai/nutrition/confirm ─────────────────────────────────────
    /// <summary>
    /// Persiste entrada nutricional após validação do usuário.
    /// </summary>
    [HttpPost("nutrition/confirm")]
    public async Task<IActionResult> ConfirmNutrition([FromBody] ConfirmNutritionDto dto)
    {
        var log = new NutritionLog
        {
            Id           = Guid.NewGuid(),
            UserId       = UserId,
            MealName     = dto.MealName ?? "Refeição",
            KcalConsumed = dto.KcalConsumed,
            ProteinG     = dto.ProteinG,
            CarbsG       = dto.CarbsG,
            FatG         = dto.FatG,
            WaterMl      = 0,
            Source       = "ai_vision",
            LoggedAt     = DateTime.UtcNow,
        };

        _db.NutritionLogs.Add(log);
        await _db.SaveChangesAsync();

        return Ok(new { id = log.Id, mealName = log.MealName, kcal = log.KcalConsumed });
    }
}

// ─── DTOs ─────────────────────────────────────────────────────────────────────
public record ImageScanDto(string Base64Image, string? MimeType = "image/jpeg");

public record ConfirmBodyDto(
    decimal? WeightKg, decimal? BodyFatPct, decimal? MuscleMassKg,
    decimal? WaterPct, decimal? BoneMassKg, decimal? VisceralFatLevel,
    decimal? Bmi, decimal? BasalMetabolicRate, decimal? WaistCm,
    string? Notes, string? RawJson
);

public record ConfirmNutritionDto(
    string? MealName, int KcalConsumed,
    float ProteinG, float CarbsG, float FatG
);
