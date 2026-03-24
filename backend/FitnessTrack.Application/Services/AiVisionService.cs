using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace FitnessTrack.Application.Services;

public interface IAiVisionService
{
    /// <summary>
    /// Processa uma imagem de bioimpedância e extrai os dados de composição corporal.
    /// NUNCA salva — retorna um DTO para o usuário validar antes.
    /// </summary>
    Task<AiBodyResult> ExtractBodyDataAsync(string base64Image, string mimeType);

    /// <summary>
    /// Processa uma imagem/foto de rótulo nutricional e extrai macros.
    /// NUNCA salva — retorna um DTO para o usuário validar antes.
    /// </summary>
    Task<AiNutritionResult> ExtractNutritionDataAsync(string base64Image, string mimeType);
}

// ─── DTOs de resultado ─────────────────────────────────────────────────────────
public record AiBodyResult(
    decimal? WeightKg,
    decimal? BodyFatPct,
    decimal? MuscleMassKg,
    decimal? WaterPct,
    decimal? BoneMassKg,
    decimal? VisceralFatLevel,
    decimal? Bmi,
    decimal? BasalMetabolicRate,
    decimal? WaistCm,
    bool IsValid,
    string? ValidationWarning,
    string RawJson
);

public record AiNutritionResult(
    string? MealName,
    int? KcalPer100g,
    float? ProteinPer100g,
    float? CarbsPer100g,
    float? FatPer100g,
    int? ServingSizeG,
    int? KcalPerServing,
    float? ProteinPerServing,
    float? CarbsPerServing,
    float? FatPerServing,
    bool IsValid,
    string? ValidationWarning,
    string RawJson
);

public class AiVisionService : IAiVisionService
{
    private readonly HttpClient _http;
    private readonly IConfiguration _config;
    private readonly ILogger<AiVisionService> _logger;

    // Limites fisiológicos para validação (spec seção 8.2)
    private static readonly (decimal min, decimal max) WeightRange     = (20m, 300m);
    private static readonly (decimal min, decimal max) BodyFatRange    = (3m, 60m);
    private static readonly (decimal min, decimal max) MuscleMassRange = (10m, 100m);
    private static readonly (decimal min, decimal max) WaterPctRange   = (30m, 80m);
    private static readonly (decimal min, decimal max) BmiRange        = (10m, 60m);
    private static readonly (decimal min, decimal max) BmrRange        = (500m, 5000m);

    public AiVisionService(IHttpClientFactory httpFactory, IConfiguration config, ILogger<AiVisionService> logger)
    {
        _http   = httpFactory.CreateClient("gemini");
        _config = config;
        _logger = logger;
    }

    public async Task<AiBodyResult> ExtractBodyDataAsync(string base64Image, string mimeType)
    {
        var prompt = """
            Analyze this bioimpedance scale result image and extract body composition data.
            Return ONLY a valid JSON object with these fields (use null for fields not found):
            {
              "weightKg": number|null,
              "bodyFatPct": number|null,
              "muscleMassKg": number|null,
              "waterPct": number|null,
              "boneMassKg": number|null,
              "visceralFatLevel": number|null,
              "bmi": number|null,
              "basalMetabolicRate": number|null,
              "waistCm": number|null
            }
            Do NOT include any explanation, just the raw JSON.
            """;

        var rawJson = await CallGeminiVisionAsync(base64Image, mimeType, prompt);

        try
        {
            using var doc  = JsonDocument.Parse(rawJson);
            var root = doc.RootElement;

            decimal? Get(string key) =>
                root.TryGetProperty(key, out var el) && el.ValueKind != JsonValueKind.Null
                    ? (decimal?)el.GetDecimal()
                    : null;

            var result = new AiBodyResult(
                WeightKg:          Get("weightKg"),
                BodyFatPct:        Get("bodyFatPct"),
                MuscleMassKg:      Get("muscleMassKg"),
                WaterPct:          Get("waterPct"),
                BoneMassKg:        Get("boneMassKg"),
                VisceralFatLevel:  Get("visceralFatLevel"),
                Bmi:               Get("bmi"),
                BasalMetabolicRate:Get("basalMetabolicRate"),
                WaistCm:           Get("waistCm"),
                IsValid:           true,
                ValidationWarning: null,
                RawJson:           rawJson
            );

            return ValidateBodyResult(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[AI] Failed to parse body result: {Json}", rawJson);
            return new AiBodyResult(null, null, null, null, null, null, null, null, null,
                false, "Não foi possível extrair dados da imagem.", rawJson);
        }
    }

    public async Task<AiNutritionResult> ExtractNutritionDataAsync(string base64Image, string mimeType)
    {
        var prompt = """
            Analyze this nutrition label or meal photo and extract nutritional information.
            Return ONLY a valid JSON object:
            {
              "mealName": string|null,
              "kcalPer100g": number|null,
              "proteinPer100g": number|null,
              "carbsPer100g": number|null,
              "fatPer100g": number|null,
              "servingSizeG": number|null,
              "kcalPerServing": number|null,
              "proteinPerServing": number|null,
              "carbsPerServing": number|null,
              "fatPerServing": number|null
            }
            Do NOT include any explanation, just the raw JSON.
            """;

        var rawJson = await CallGeminiVisionAsync(base64Image, mimeType, prompt);

        try
        {
            using var doc = JsonDocument.Parse(rawJson);
            var root = doc.RootElement;

            string? GetStr(string key) =>
                root.TryGetProperty(key, out var el) && el.ValueKind == JsonValueKind.String
                    ? el.GetString()
                    : null;

            int? GetInt(string key) =>
                root.TryGetProperty(key, out var el) && el.ValueKind != JsonValueKind.Null
                    ? (int?)el.GetInt32()
                    : null;

            float? GetFloat(string key) =>
                root.TryGetProperty(key, out var el) && el.ValueKind != JsonValueKind.Null
                    ? (float?)el.GetSingle()
                    : null;

            var result = new AiNutritionResult(
                MealName:         GetStr("mealName"),
                KcalPer100g:      GetInt("kcalPer100g"),
                ProteinPer100g:   GetFloat("proteinPer100g"),
                CarbsPer100g:     GetFloat("carbsPer100g"),
                FatPer100g:       GetFloat("fatPer100g"),
                ServingSizeG:     GetInt("servingSizeG"),
                KcalPerServing:   GetInt("kcalPerServing"),
                ProteinPerServing:GetFloat("proteinPerServing"),
                CarbsPerServing:  GetFloat("carbsPerServing"),
                FatPerServing:    GetFloat("fatPerServing"),
                IsValid:          true,
                ValidationWarning: null,
                RawJson:          rawJson
            );

            return ValidateNutritionResult(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[AI] Failed to parse nutrition result: {Json}", rawJson);
            return new AiNutritionResult(null, null, null, null, null, null, null, null, null, null,
                false, "Não foi possível extrair dados da imagem.", rawJson);
        }
    }

    // ─── Gemini API ────────────────────────────────────────────────────────
    private async Task<string> CallGeminiVisionAsync(string base64Image, string mimeType, string prompt)
    {
        var apiKey = _config["Gemini:ApiKey"]
            ?? throw new InvalidOperationException("Gemini:ApiKey not configured");

        var requestBody = new
        {
            contents = new[]
            {
                new
                {
                    parts = new object[]
                    {
                        new { text = prompt },
                        new
                        {
                            inline_data = new
                            {
                                mime_type = mimeType,
                                data = base64Image,
                            }
                        }
                    }
                }
            },
            generationConfig = new
            {
                temperature      = 0.1,
                maxOutputTokens  = 1024,
                responseMimeType = "application/json",
            }
        };

        var url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={apiKey}";
        var json = JsonSerializer.Serialize(requestBody);

        var response = await _http.PostAsync(url,
            new StringContent(json, Encoding.UTF8, "application/json"));

        response.EnsureSuccessStatusCode();

        var responseJson = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(responseJson);

        // Extrai o texto da resposta do Gemini
        return doc.RootElement
            .GetProperty("candidates")[0]
            .GetProperty("content")
            .GetProperty("parts")[0]
            .GetProperty("text")
            .GetString() ?? "{}";
    }

    // ─── Validação fisiológica ─────────────────────────────────────────────
    private static AiBodyResult ValidateBodyResult(AiBodyResult r)
    {
        var warnings = new List<string>();

        if (r.WeightKg.HasValue && (r.WeightKg < WeightRange.min || r.WeightKg > WeightRange.max))
            warnings.Add($"Peso {r.WeightKg}kg fora do intervalo esperado (20-300kg)");

        if (r.BodyFatPct.HasValue && (r.BodyFatPct < BodyFatRange.min || r.BodyFatPct > BodyFatRange.max))
            warnings.Add($"% gordura {r.BodyFatPct}% fora do intervalo esperado (3-60%)");

        if (r.MuscleMassKg.HasValue && (r.MuscleMassKg < MuscleMassRange.min || r.MuscleMassKg > MuscleMassRange.max))
            warnings.Add($"Massa muscular {r.MuscleMassKg}kg fora do intervalo esperado (10-100kg)");

        if (r.Bmi.HasValue && (r.Bmi < BmiRange.min || r.Bmi > BmiRange.max))
            warnings.Add($"IMC {r.Bmi} fora do intervalo esperado (10-60)");

        var warning = warnings.Count > 0 ? string.Join("; ", warnings) : null;
        return r with { IsValid = warnings.Count == 0, ValidationWarning = warning };
    }

    private static AiNutritionResult ValidateNutritionResult(AiNutritionResult r)
    {
        var warnings = new List<string>();

        if (r.KcalPer100g.HasValue && (r.KcalPer100g < 0 || r.KcalPer100g > 900))
            warnings.Add($"Calorias/100g inválidas: {r.KcalPer100g}");

        if (r.ProteinPer100g.HasValue && (r.ProteinPer100g < 0 || r.ProteinPer100g > 100))
            warnings.Add($"Proteína/100g inválida: {r.ProteinPer100g}g");

        if (r.CarbsPer100g.HasValue && (r.CarbsPer100g < 0 || r.CarbsPer100g > 100))
            warnings.Add($"Carboidratos/100g inválidos: {r.CarbsPer100g}g");

        if (r.FatPer100g.HasValue && (r.FatPer100g < 0 || r.FatPer100g > 100))
            warnings.Add($"Gordura/100g inválida: {r.FatPer100g}g");

        var warning = warnings.Count > 0 ? string.Join("; ", warnings) : null;
        return r with { IsValid = warnings.Count == 0, ValidationWarning = warning };
    }
}
