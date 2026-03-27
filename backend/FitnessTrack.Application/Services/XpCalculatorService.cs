using FitnessTrack.Core.Entities;

namespace FitnessTrack.Application.Services;

public interface IXpCalculatorService
{
    Task<XpResult> CalculateSessionXpAsync(WorkoutSession session, IList<HunterSkill>? activeSkills = null);
    int CalcSetXp(string category, decimal weightKg, int reps);
}

public record XpResult(int TotalXp, double Multiplier, string Breakdown);

public class XpCalculatorService : IXpCalculatorService
{
    // XP base por série por categoria (spec seção 17)
    private static readonly Dictionary<string, int> XpBase = new()
    {
        ["compound_heavy"]  = 15,
        ["compound_medium"] = 10,
        ["bodyweight"]      = 12,
        ["isolation"]       = 7,
    };

    // Bônus por tipo de dungeon
    private static readonly Dictionary<string, double> DungeonBonus = new()
    {
        ["normal"]    = 0.0,
        ["crisis"]    = 0.5,
        ["red_gate"]  = 1.0,
        ["hidden"]    = 0.75,
        ["boss"]      = 2.0,
    };

    public Task<XpResult> CalculateSessionXpAsync(WorkoutSession session, IList<HunterSkill>? activeSkills = null)
    {
        int rawXp = 0;
        bool prBeaten = session.PrBeaten;

        foreach (var set in session.Sets.Where(s => s.Completed && s.WeightKg.HasValue && s.RepsDone.HasValue))
        {
            var category = set.Exercise?.ExerciseCategory ?? "isolation";
            rawXp += CalcSetXp(category, set.WeightKg!.Value, set.RepsDone!.Value);
        }

        if (prBeaten)
            rawXp = (int)(rawXp * 1.5);

        double dungeonBonus = DungeonBonus.TryGetValue(session.DungeonType, out var b) ? b : 0;
        double multiplier = 1.0 + dungeonBonus;

        // Aplicar skill multipliers: skills passivas com effect_type = "xp_multiplier"
        double skillBonus = 0.0;
        if (activeSkills != null)
        {
            foreach (var skill in activeSkills.Where(s =>
                s.EffectType == "xp_multiplier" && s.EffectValue.HasValue && s.IsActive))
            {
                skillBonus += (double)skill.EffectValue!.Value;
            }
        }
        multiplier += skillBonus;

        int finalXp = (int)(rawXp * multiplier);
        string breakdown = $"Base: {rawXp} XP"
            + (prBeaten ? " (+PR)" : "")
            + (dungeonBonus > 0 ? $" ×{1.0 + dungeonBonus:F1} ({session.DungeonType})" : "")
            + (skillBonus > 0 ? $" +{skillBonus * 100:F0}% skill" : "");

        return Task.FromResult(new XpResult(finalXp, multiplier, breakdown));
    }

    public int CalcSetXp(string category, decimal weightKg, int reps)
    {
        int xpBase = XpBase.TryGetValue(category, out var b) ? b : 7;
        double weightFactor = 1.0 + (double)weightKg / 100.0;
        double repsFactor = reps >= 12 ? 1.1 : reps >= 8 ? 1.0 : 0.9;
        return (int)(xpBase * weightFactor * repsFactor);
    }
}
