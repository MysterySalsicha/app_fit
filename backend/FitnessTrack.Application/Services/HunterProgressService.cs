using FitnessTrack.Core.Entities;
using FitnessTrack.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace FitnessTrack.Application.Services;

public interface IHunterProgressService
{
    Task<LevelResult> AddXpAsync(Guid userId, int xp);
    Task<AllocateResult> AllocateStatPointAsync(Guid userId, string stat);
}

public record LevelResult(bool LeveledUp, bool RankedUp, int NewLevel, string NewRank, int OldLevel, string OldRank);
public record AllocateResult(bool Success, string? Error = null);

public class HunterProgressService : IHunterProgressService
{
    // Ranks em ordem (spec seção 14)
    private static readonly string[] Ranks = { "E", "D", "C", "B", "A", "S", "National" };

    // XP por nível (spec seção 17)
    private static int XpForLevel(int level) => (int)(100 * Math.Pow(level, 1.8));

    // Nível mínimo para rank up (spec seção 14)
    private static readonly Dictionary<string, int> RankThreshold = new()
    {
        ["E"] = 0,
        ["D"] = 20,
        ["C"] = 50,
        ["B"] = 100,
        ["A"] = 200,
        ["S"] = 400,
        ["National"] = 800,
    };

    private readonly AppDbContext _db;

    public HunterProgressService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<LevelResult> AddXpAsync(Guid userId, int xp)
    {
        var hunter = await _db.HunterProfiles.FirstOrDefaultAsync(h => h.UserId == userId)
            ?? throw new InvalidOperationException("HunterProfile not found");

        int oldLevel = hunter.HunterLevel;
        string oldRank = hunter.HunterRank;

        // Adicionar XP
        hunter.CurrentXp += xp;
        hunter.TotalXpEver += xp;

        // Level up loop
        bool leveledUp = false;
        while (true)
        {
            int needed = XpForLevel(hunter.HunterLevel + 1);
            if (hunter.CurrentXp < needed) break;

            hunter.CurrentXp -= needed;
            hunter.HunterLevel++;
            hunter.StatPointsAvailable++;
            leveledUp = true;
        }

        // Rank up check
        bool rankedUp = false;
        int rankIdx = Array.IndexOf(Ranks, hunter.HunterRank);
        if (rankIdx < Ranks.Length - 1)
        {
            string nextRank = Ranks[rankIdx + 1];
            if (hunter.HunterLevel >= RankThreshold[nextRank])
            {
                // TODO: checar sub_rank (rank test quest) — aqui simplificamos
                hunter.HunterRank = nextRank;
                rankedUp = true;
            }
        }

        // Registrar evento de XP
        _db.XpEvents.Add(new XpEvent
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            EventType = "session",
            XpGained = xp,
            Multiplier = 1.0m,
            Description = $"Sessão de treino — +{xp} XP",
            CreatedAt = DateTime.UtcNow,
        });

        hunter.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return new LevelResult(leveledUp, rankedUp, hunter.HunterLevel, hunter.HunterRank, oldLevel, oldRank);
    }

    public async Task<AllocateResult> AllocateStatPointAsync(Guid userId, string stat)
    {
        var hunter = await _db.HunterProfiles.FirstOrDefaultAsync(h => h.UserId == userId);
        if (hunter == null) return new AllocateResult(false, "Hunter não encontrado");
        if (hunter.StatPointsAvailable <= 0) return new AllocateResult(false, "Sem pontos disponíveis");

        switch (stat.ToLower())
        {
            case "str": hunter.StatStr++; break;
            case "vit": hunter.StatVit++; break;
            case "agi": hunter.StatAgi++; break;
            case "int": hunter.StatInt++; break;
            case "per": hunter.StatPer++; break;
            default: return new AllocateResult(false, "Atributo inválido");
        }

        hunter.StatPointsAvailable--;
        await _db.SaveChangesAsync();
        return new AllocateResult(true);
    }
}
