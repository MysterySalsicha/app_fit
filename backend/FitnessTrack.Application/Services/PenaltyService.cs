using FitnessTrack.Core.Entities;
using FitnessTrack.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace FitnessTrack.Application.Services;

public interface IPenaltyService
{
    Task<PenaltyStatus> GetPenaltyStatusAsync(Guid userId);
    Task<bool> TriggerPenaltyIfNeededAsync(Guid userId);
}

public record PenaltyStatus(
    bool IsInPenaltyZone,
    bool HasActiveRescueQuest,
    int DaysMissed,
    string? ThreatMessage
);

/// <summary>
/// Sistema de Penalidade e Zona de Resgate (spec seção 20).
/// Regras principais:
/// - 3 dias sem treino → Zona de Penalidade
/// - 7 dias sem treino → Rank Down (se não completou Quest de Resgate)
/// - Immunity Token protege uma vez
/// </summary>
public class PenaltyService : IPenaltyService
{
    private readonly AppDbContext _db;

    public PenaltyService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<PenaltyStatus> GetPenaltyStatusAsync(Guid userId)
    {
        var workoutStreak = await _db.Streaks
            .FirstOrDefaultAsync(s => s.UserId == userId && s.StreakType == "workout");

        if (workoutStreak?.LastValidDate == null)
            return new PenaltyStatus(false, false, 0, null);

        int daysMissed = DateOnly.FromDateTime(DateTime.UtcNow).DayNumber
            - workoutStreak.LastValidDate.Value.DayNumber - 1;

        if (daysMissed < 3)
            return new PenaltyStatus(false, false, daysMissed, null);

        bool hasRescue = await _db.HunterQuests.AnyAsync(q =>
            q.UserId == userId &&
            q.QuestType == "penalty_rescue" &&
            q.Status == "active");

        string threat = daysMissed >= 7
            ? "⚠️ O Sistema irá rebaixar seu rank em breve. Complete a Quest de Resgate!"
            : $"⚠️ Zona de Penalidade — {7 - daysMissed} dias restantes para resgate.";

        return new PenaltyStatus(true, hasRescue, daysMissed, threat);
    }

    public async Task<bool> TriggerPenaltyIfNeededAsync(Guid userId)
    {
        var status = await GetPenaltyStatusAsync(userId);

        if (!status.IsInPenaltyZone || status.DaysMissed < 7)
            return false;

        var hunter = await _db.HunterProfiles.FirstOrDefaultAsync(h => h.UserId == userId);
        if (hunter == null) return false;

        // Verifica immunity token
        if (hunter.ImmunityTokens > 0)
        {
            hunter.ImmunityTokens--;
            await _db.SaveChangesAsync();
            return false; // Protegido
        }

        // Rank down
        string[] ranks = { "E", "D", "C", "B", "A", "S", "National" };
        int idx = Array.IndexOf(ranks, hunter.HunterRank);
        if (idx > 0)
        {
            hunter.HunterRank = ranks[idx - 1];
            hunter.HunterSubRank = 3; // Vai para sub-rank fraco
        }

        await _db.SaveChangesAsync();
        return true;
    }
}
