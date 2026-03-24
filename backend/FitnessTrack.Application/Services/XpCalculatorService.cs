using FitnessTrack.Core.Entities;

namespace FitnessTrack.Application.Services;

public interface IXpCalculatorService
{
    Task<XpResult> CalculateSessionXpAsync(WorkoutSession session);
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

    public Task<XpResult> CalculateSessionXpAsync(WorkoutSession session)
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

        // TODO: aplicar skill multiplier e event multiplier da tabela hunter_skills / events

        int finalXp = (int)(rawXp * multiplier);
        string breakdown = $"Base: {rawXp} XP"
            + (prBeaten ? " (+PR)" : "")
            + (dungeonBonus > 0 ? $" ×{multiplier:F1} ({session.DungeonType})" : "");

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
