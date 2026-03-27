using System.Text.RegularExpressions;
using FitnessTrack.Core.Entities;

namespace FitnessTrack.Application.Services;

// ─── Modelos de resultado ──────────────────────────────────────────────────────

public class ParsedMeal
{
    public int MealNumber { get; set; }
    public string Name { get; set; } = "";
    public string? SuggestedTime { get; set; }
    public int KcalEstimate { get; set; }
    public float ProteinG { get; set; }
    public float CarbsG { get; set; }
    public float FatG { get; set; }
    public List<string> Foods { get; set; } = new();
}

public class DietParseResult
{
    public List<ParsedMeal> Meals { get; set; } = new();
    public int TotalKcal { get; set; }
    public float TotalProteinG { get; set; }
    public float TotalCarbsG { get; set; }
    public float TotalFatG { get; set; }
    public bool MacrosSumValid { get; set; }    // PD-03: diferença ≤ 10 kcal
    public int IgnoredLines { get; set; }
}

// ─── Interface e implementação ────────────────────────────────────────────────

public interface IDietParserService
{
    DietParseResult Parse(string rawTxt);
    List<NutritionLog> ToNutritionLogs(DietParseResult result, Guid userId);
}

/// <summary>
/// Parser de plano alimentar em texto livre.
/// Implementa spec PD-01 (refeições numeradas), PD-02 (macros) e PD-03 (total diário).
/// </summary>
public class DietParserService : IDietParserService
{
    // ── Padrões de refeição ────────────────────────────────────────────────
    // "Refeição 1:", "Refeição 1 -", "1.", "Café da manhã:", "Refeição 3 (12h):"
    private static readonly Regex RxMealHeader = new(
        @"(?:refeição|meal|refeicao)[\s\-:]*(\d+)|^(\d+)[).\-][\s]+|^(café\s+da\s+manhã|almoço|jantar|ceia|lanche)",
        RegexOptions.IgnoreCase | RegexOptions.Compiled);

    private static readonly Regex RxTime = new(
        @"\(?\b(\d{1,2}[h:]\d{0,2}|\d{1,2}h)\b\)?",
        RegexOptions.IgnoreCase | RegexOptions.Compiled);

    // ── Padrões de macros ──────────────────────────────────────────────────
    private static readonly Regex RxProtein = new(
        @"(?:proteína|protein|prot|p)[\s:=\-]*(\d+(?:[.,]\d+)?)\s*g",
        RegexOptions.IgnoreCase | RegexOptions.Compiled);

    private static readonly Regex RxCarbs = new(
        @"(?:carboidrato|carbs?|cho|c)[\s:=\-]*(\d+(?:[.,]\d+)?)\s*g",
        RegexOptions.IgnoreCase | RegexOptions.Compiled);

    private static readonly Regex RxFat = new(
        @"(?:gordura|fat|lip[ií]deo?s?|g)[\s:=\-]*(\d+(?:[.,]\d+)?)\s*g",
        RegexOptions.IgnoreCase | RegexOptions.Compiled);

    private static readonly Regex RxKcal = new(
        @"(\d+(?:[.,]\d+)?)\s*(?:kcal|cal|calorias?)",
        RegexOptions.IgnoreCase | RegexOptions.Compiled);

    // ── Padrões de "total" ────────────────────────────────────────────────
    private static readonly Regex RxTotal = new(
        @"^(?:total|soma|meta\s+diária?|diário)",
        RegexOptions.IgnoreCase | RegexOptions.Compiled);

    public DietParseResult Parse(string rawTxt)
    {
        var result      = new DietParseResult();
        var lines       = rawTxt.Split('\n', StringSplitOptions.RemoveEmptyEntries);
        ParsedMeal? cur = null;
        int mealCounter = 0;
        int ignored     = 0;

        // Totais declarados no TXT (PD-03)
        float declaredProtein = 0, declaredCarbs = 0, declaredFat = 0;
        int   declaredKcal    = 0;
        bool  foundDeclaredTotal = false;

        foreach (var rawLine in lines)
        {
            var line = rawLine.Trim();
            if (string.IsNullOrWhiteSpace(line)) continue;

            // ── Total declarado no TXT ─────────────────────────────────────
            if (RxTotal.IsMatch(line))
            {
                foundDeclaredTotal = true;
                TryExtractMacros(line,
                    out float dp, out float dc, out float df, out int dk);
                declaredProtein = dp; declaredCarbs = dc;
                declaredFat = df; declaredKcal = dk;
                continue;
            }

            // ── Novo bloco de refeição ─────────────────────────────────────
            if (RxMealHeader.IsMatch(line))
            {
                if (cur != null) result.Meals.Add(cur);

                mealCounter++;
                cur = new ParsedMeal
                {
                    MealNumber = mealCounter,
                    Name       = ExtractMealName(line),
                    SuggestedTime = ExtractTime(line),
                };
                TryExtractMacros(line, out float p, out float c, out float f, out int k);
                cur.ProteinG = p; cur.CarbsG = c; cur.FatG = f; cur.KcalEstimate = k;
                continue;
            }

            // ── Macro avulso dentro de uma refeição ───────────────────────
            if (cur != null && (RxProtein.IsMatch(line) || RxCarbs.IsMatch(line)
                    || RxFat.IsMatch(line) || RxKcal.IsMatch(line)))
            {
                TryExtractMacros(line, out float p, out float c, out float f, out int k);
                if (cur.ProteinG == 0 && p > 0) cur.ProteinG = p;
                if (cur.CarbsG   == 0 && c > 0) cur.CarbsG   = c;
                if (cur.FatG     == 0 && f > 0) cur.FatG     = f;
                if (cur.KcalEstimate == 0 && k > 0) cur.KcalEstimate = k;
                continue;
            }

            // ── Alimento dentro de uma refeição ───────────────────────────
            if (cur != null && line.Length > 3)
            {
                cur.Foods.Add(line);
                continue;
            }

            ignored++;
        }

        if (cur != null) result.Meals.Add(cur);

        // ── Calcular calorias estimadas se não informadas ──────────────────
        foreach (var meal in result.Meals)
        {
            if (meal.KcalEstimate == 0 && (meal.ProteinG > 0 || meal.CarbsG > 0 || meal.FatG > 0))
            {
                // 4 kcal/g proteína e carboidrato, 9 kcal/g gordura
                meal.KcalEstimate = (int)(meal.ProteinG * 4 + meal.CarbsG * 4 + meal.FatG * 9);
            }
        }

        // ── Totais calculados ──────────────────────────────────────────────
        result.TotalProteinG = result.Meals.Sum(m => m.ProteinG);
        result.TotalCarbsG   = result.Meals.Sum(m => m.CarbsG);
        result.TotalFatG     = result.Meals.Sum(m => m.FatG);
        result.TotalKcal     = result.Meals.Sum(m => m.KcalEstimate);
        result.IgnoredLines  = ignored;

        // ── PD-03: valida soma vs. total declarado (±10 kcal) ────────────
        if (foundDeclaredTotal && declaredKcal > 0)
        {
            int kcalFromMacros = (int)(declaredProtein * 4 + declaredCarbs * 4 + declaredFat * 9);
            result.MacrosSumValid = Math.Abs(kcalFromMacros - declaredKcal) <= 10;
        }
        else
        {
            result.MacrosSumValid = true; // sem total declarado, não há o que validar
        }

        return result;
    }

    /// <summary>Converte resultado em NutritionLog entries com source "import".</summary>
    public List<NutritionLog> ToNutritionLogs(DietParseResult result, Guid userId)
    {
        var now   = DateTime.UtcNow.Date;
        var logs  = new List<NutritionLog>();
        int hour  = 7; // começa às 07h e incrementa por refeição

        foreach (var meal in result.Meals)
        {
            logs.Add(new NutritionLog
            {
                Id           = Guid.NewGuid(),
                UserId       = userId,
                MealName     = meal.Name,
                KcalConsumed = meal.KcalEstimate,
                ProteinG     = meal.ProteinG,
                CarbsG       = meal.CarbsG,
                FatG         = meal.FatG,
                Source       = "import",
                LoggedAt     = now.AddHours(hour),
            });
            hour += 3; // espaça 3 horas entre refeições
        }

        return logs;
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private static string ExtractMealName(string line)
    {
        // Remove número/prefixo e retorna o nome limpo
        var clean = Regex.Replace(line, @"^(refeição|meal|refeicao)\s*\d+\s*[-:(]?", "",
            RegexOptions.IgnoreCase).Trim();
        clean = Regex.Replace(clean, @"^\d+[).\-]\s*", "").Trim();
        clean = RxTime.Replace(clean, "").Trim(new[] { ' ', '-', ':', '(' });
        return string.IsNullOrWhiteSpace(clean) ? $"Refeição" : TitleCase(clean);
    }

    private static string? ExtractTime(string line)
    {
        var m = RxTime.Match(line);
        return m.Success ? m.Value.Trim('(', ')') : null;
    }

    private static void TryExtractMacros(string line,
        out float protein, out float carbs, out float fat, out int kcal)
    {
        protein = ParseFloat(RxProtein.Match(line).Groups[1].Value);
        carbs   = ParseFloat(RxCarbs.Match(line).Groups[1].Value);
        fat     = ParseFloat(RxFat.Match(line).Groups[1].Value);
        kcal    = (int)ParseFloat(RxKcal.Match(line).Groups[1].Value);
    }

    private static float ParseFloat(string s) =>
        float.TryParse(s.Replace(',', '.'),
            System.Globalization.NumberStyles.Float,
            System.Globalization.CultureInfo.InvariantCulture, out var v) ? v : 0;

    private static string TitleCase(string s) =>
        System.Globalization.CultureInfo.CurrentCulture.TextInfo.ToTitleCase(s.ToLower());
}
