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
/// Regras:
/// - 3 dias sem treino → Zona de Penalidade + cria Quest de Resgate se não existir
/// - 7 dias sem treino + Quest NÃO concluída → Rank Down
/// - Immunity Token protege uma vez (consome o token, evita rank down)
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
        var workoutStreak = await _db.Streaks
            .FirstOrDefaultAsync(s => s.UserId == userId && s.StreakType == "workout");

        if (workoutStreak?.LastValidDate == null) return false;

        int daysMissed = DateOnly.FromDateTime(DateTime.UtcNow).DayNumber
            - workoutStreak.LastValidDate.Value.DayNumber - 1;

        if (daysMissed < 3) return false;

        // ── 3 dias: garante que existe uma Quest de Resgate ativa ────────────
        bool alreadyHasRescue = await _db.HunterQuests.AnyAsync(q =>
            q.UserId == userId &&
            q.QuestType == "penalty_rescue" &&
            (q.Status == "active" || q.Status == "completed"));

        if (!alreadyHasRescue)
        {
            var rescueQuest = new HunterQuest
            {
                Id          = Guid.NewGuid(),
                UserId      = userId,
                QuestType   = "penalty_rescue",
                QuestKey    = "emergency_return",
                Title       = "Missão de Resgate: Retorno do Caçador",
                Description = "O Sistema detectou ausência prolongada. Complete 2 treinos em 4 dias para evitar o rebaixamento de rank.",
                Narrative   = "\"Caçador... o Sistema ainda acredita em você. Prove que não desistiu.\"",
                Status      = "active",
                ModulesJson = "{\"workoutsRequired\":2,\"workoutsCompleted\":0}",
                XpReward    = 500,
                StartsAt    = DateTime.UtcNow,
                ExpiresAt   = DateTime.UtcNow.AddDays(4),
            };
            _db.HunterQuests.Add(rescueQuest);
            await _db.SaveChangesAsync();
        }

        // ── 7 dias: verifica se o hunter salvou a skin ───────────────────────
        if (daysMissed < 7) return false;

        // Quest de resgate concluída? → sem penalidade
        bool rescueCompleted = await _db.HunterQuests.AnyAsync(q =>
            q.UserId == userId &&
            q.QuestType == "penalty_rescue" &&
            q.Status == "completed" &&
            q.CompletedAt >= DateTime.UtcNow.AddDays(-7));

        if (rescueCompleted) return false;

        var hunter = await _db.HunterProfiles.FirstOrDefaultAsync(h => h.UserId == userId);
        if (hunter == null) return false;

        // Immunity token protege uma vez
        if (hunter.ImmunityTokens > 0)
        {
            hunter.ImmunityTokens--;
            await _db.SaveChangesAsync();
            return false;
        }

        // Rank down
        string[] ranks = { "E", "D", "C", "B", "A", "S", "National" };
        int idx = Array.IndexOf(ranks, hunter.HunterRank);
        if (idx > 0)
        {
            hunter.HunterRank    = ranks[idx - 1];
            hunter.HunterSubRank = 3; // sub-rank fraco
        }

        // Expirar a quest de resgate pendente
        var activeRescue = await _db.HunterQuests.FirstOrDefaultAsync(q =>
            q.UserId == userId &&
            q.QuestType == "penalty_rescue" &&
            q.Status == "active");
        if (activeRescue != null)
            activeRescue.Status = "expired";

        await _db.SaveChangesAsync();
        return true;
    }
}
