using FitnessTrack.Core.Entities;
using FitnessTrack.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace FitnessTrack.Application.Services;

public interface IMuscleRankService
{
    Task UpdateAfterSessionAsync(WorkoutSession session);
}

public class MuscleRankService : IMuscleRankService
{
    // 17 grupos musculares (spec seção 15)
    private static readonly Dictionary<string, string> MuscleNames = new()
    {
        ["chest"]        = "Peito",
        ["back_lat"]     = "Costas (Lat)",
        ["back_mid"]     = "Costas (Mid)",
        ["shoulders"]    = "Ombros",
        ["biceps"]       = "Bíceps",
        ["triceps"]      = "Tríceps",
        ["forearms"]     = "Antebraços",
        ["quads"]        = "Quadríceps",
        ["hamstrings"]   = "Isquiotibiais",
        ["glutes"]       = "Glúteos",
        ["calves"]       = "Panturrilha",
        ["abs"]          = "Abdômen",
        ["obliques"]     = "Oblíquos",
        ["traps"]        = "Trapézio",
        ["neck"]         = "Pescoço",
        ["hip_flexors"]  = "Flexores do Quadril",
        ["cardio"]       = "Cardio (AGI)",
    };

    // Ranks musculares em ordem (spec seção 15)
    private static readonly string[] RankNames =
    {
        "Untrained", "Beginner", "Novice", "Intermediate",
        "Advanced",  "Elite",    "Master", "Grandmaster",
        "National",  "World Class", "Legendary", "Mythic",
        "Transcendent", "Divine", "Absolute", "Legend",
    };

    // Volume 30d mínimo para cada rank
    private static readonly decimal[] RankThresholds =
    {
        0, 500, 1500, 4000, 10000, 25000, 60000, 150000,
        350000, 750000, 1500000, 3000000, 6000000, 12000000, 25000000, 50000000,
    };

    private readonly AppDbContext _db;

    public MuscleRankService(AppDbContext db)
    {
        _db = db;
    }

    public async Task UpdateAfterSessionAsync(WorkoutSession session)
    {
        // Agrupa volume por grupo muscular
        var volumeByMuscle = session.Sets
            .Where(s => s.Completed && s.Exercise?.PrimaryMuscleGroup != null)
            .GroupBy(s => s.Exercise!.PrimaryMuscleGroup!)
            .ToDictionary(
                g => g.Key,
                g => g.Sum(s => s.VolumeLoadKg ?? 0));

        foreach (var (muscle, volume) in volumeByMuscle)
        {
            var rank = await _db.MuscleRanks
                .FirstOrDefaultAsync(mr => mr.UserId == session.UserId && mr.MuscleGroup == muscle);

            if (rank == null)
            {
                rank = new MuscleRank
                {
                    Id = Guid.NewGuid(),
                    UserId = session.UserId,
                    MuscleGroup = muscle,
                    MuscleNamePt = MuscleNames.TryGetValue(muscle, out var n) ? n : muscle,
                    MuscleRankValue = "Untrained",
                    MuscleRankNumeric = 0,
                };
                _db.MuscleRanks.Add(rank);
            }

            // Atualiza volume 30d (simplificado — produção usaria query com janela de 30 dias)
            rank.TotalVolume30d += volume;
            rank.Sessions30d++;

            // Verifica rank up
            string newRank = ResolveRank(rank.TotalVolume30d);
            if (newRank != rank.MuscleRankValue)
            {
                int newIdx = Array.IndexOf(RankNames, newRank);
                if (newIdx > rank.MuscleRankNumeric)
                {
                    rank.MuscleRankValue = newRank;
                    rank.MuscleRankNumeric = newIdx;
                    rank.RankUpCount++;
                    rank.LastRankUp = DateTime.UtcNow;

                    // TODO: disparar notificação de rank up muscular
                }
            }
        }

        await _db.SaveChangesAsync();
    }

    private static string ResolveRank(decimal volume30d)
    {
        for (int i = RankThresholds.Length - 1; i >= 0; i--)
        {
            if (volume30d >= RankThresholds[i])
                return RankNames[i];
        }
        return "Untrained";
    }
}
