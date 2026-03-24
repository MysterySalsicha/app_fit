using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FitnessTrack.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace FitnessTrack.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly AppDbContext _db;

    public DashboardController(AppDbContext db) => _db = db;

    private Guid UserId =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // ─── GET /api/dashboard ───────────────────────────────────────────────
    /// <summary>
    /// Dados agregados para o painel principal: streaks, água, treino, XP, quests ativas.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetDashboard()
    {
        var userId  = UserId;
        var today   = DateOnly.FromDateTime(DateTime.UtcNow);
        var todayDt = DateTime.UtcNow.Date;

        // ── Hunter profile ────────────────────────────────────────────────
        var profile = await _db.HunterProfiles
            .FirstOrDefaultAsync(h => h.UserId == userId);

        // ── Streaks ───────────────────────────────────────────────────────
        var streaks = await _db.Streaks
            .Where(s => s.UserId == userId)
            .ToListAsync();

        // ── Treino de hoje ────────────────────────────────────────────────
        var todaySession = await _db.WorkoutSessions
            .Where(s => s.UserId == userId && s.SessionDate == today)
            .OrderByDescending(s => s.StartedAt)
            .Select(s => new
            {
                s.Id,
                s.DungeonType,
                s.DungeonCleared,
                s.XpEarned,
                s.TotalDurationSeconds,
                s.TotalVolumeLoadKg,
            })
            .FirstOrDefaultAsync();

        // ── Nutrição hoje ─────────────────────────────────────────────────
        var nutritionToday = await _db.NutritionLogs
            .Where(n => n.UserId == userId && n.LoggedAt >= todayDt && n.LoggedAt < todayDt.AddDays(1))
            .GroupBy(_ => 1)
            .Select(g => new
            {
                kcal    = g.Sum(n => n.KcalConsumed),
                protein = g.Sum(n => n.ProteinG),
                carbs   = g.Sum(n => n.CarbsG),
                fat     = g.Sum(n => n.FatG),
                waterMl = g.Sum(n => n.WaterMl),
            })
            .FirstOrDefaultAsync();

        // ── Quests diárias ────────────────────────────────────────────────
        var activeQuests = await _db.HunterQuests
            .Where(q => q.UserId == userId && q.Status == "active" && q.QuestType == "daily")
            .Select(q => new
            {
                q.Id,
                q.Title,
                q.QuestType,
                q.XpReward,
                q.ExpiresAt,
                q.ModulesJson,
            })
            .FirstOrDefaultAsync();

        // ── XP recentes (últimas 24h) ────────────────────────────────────
        var xpToday = await _db.XpEvents
            .Where(x => x.UserId == userId && x.CreatedAt >= todayDt)
            .SumAsync(x => (long?)x.XpGained) ?? 0;

        // ── Última medição corporal ────────────────────────────────────────
        var latestBody = await _db.BodyMeasurements
            .Where(b => b.UserId == userId)
            .OrderByDescending(b => b.MeasuredAt)
            .Select(b => new
            {
                b.WeightKg,
                b.BodyFatPct,
                b.MuscleMassKg,
                b.MeasuredAt,
            })
            .FirstOrDefaultAsync();

        return Ok(new
        {
            profile = profile == null ? null : new
            {
                level           = profile.HunterLevel,
                rank            = profile.HunterRank,
                hunterClass     = profile.HunterClass,
                currentXp       = profile.CurrentXp,
                xpToNextLevel   = (long)Math.Floor(100 * Math.Pow(profile.HunterLevel + 1, 1.8)),
                statPointsAvailable = profile.StatPointsAvailable,
                shadowIgrisLevel = profile.ShadowIgrisLevel,
                shadowTankLevel  = profile.ShadowTankLevel,
                shadowIronLevel  = profile.ShadowIronLevel,
                shadowFangLevel  = profile.ShadowFangLevel,
            },
            streaks,
            todaySession,
            nutrition = nutritionToday ?? new { kcal = 0, protein = 0.0, carbs = 0.0, fat = 0.0, waterMl = 0 },
            activeQuest = activeQuests,
            xpToday,
            latestBody,
        });
    }

    // ─── GET /api/dashboard/streaks ───────────────────────────────────────
    /// <summary>
    /// Estado atual das 4 streaks (workout | diet | cardio | water).
    /// </summary>
    [HttpGet("streaks")]
    public async Task<IActionResult> GetStreaks()
    {
        var streaks = await _db.Streaks
            .Where(s => s.UserId == UserId)
            .ToListAsync();

        return Ok(streaks);
    }

    // ─── GET /api/dashboard/weekly-report ─────────────────────────────────
    /// <summary>
    /// Relatório semanal: volume, sessions, XP total, quests completadas, PR count.
    /// </summary>
    [HttpGet("weekly-report")]
    public async Task<IActionResult> GetWeeklyReport()
    {
        var userId     = UserId;
        var weekStart  = DateTime.UtcNow.AddDays(-7).Date;
        var weekEnd    = DateTime.UtcNow.Date;

        var sessions = await _db.WorkoutSessions
            .Where(s => s.UserId == userId &&
                        s.SessionDate >= DateOnly.FromDateTime(weekStart) &&
                        s.DungeonCleared)
            .ToListAsync();

        var xpTotal = await _db.XpEvents
            .Where(x => x.UserId == userId && x.CreatedAt >= weekStart)
            .SumAsync(x => (long?)x.XpGained) ?? 0;

        var questsCompleted = await _db.HunterQuests
            .CountAsync(q => q.UserId == userId &&
                             q.Status == "completed" &&
                             q.CompletedAt >= weekStart);

        var prCount = await _db.ExercisePRs
            .CountAsync(pr => pr.UserId == userId &&
                              pr.LastBeatenAt >= weekStart);

        var volumeByMuscle = sessions
            .GroupBy(s => s.Day?.PrimaryMuscleGroup ?? "outros")
            .Select(g => new
            {
                muscle = g.Key,
                volumeKg = g.Sum(s => s.TotalVolumeLoadKg ?? 0),
                sessions = g.Count(),
            })
            .OrderByDescending(g => g.volumeKg)
            .ToList();

        return Ok(new
        {
            weekStart = DateOnly.FromDateTime(weekStart),
            weekEnd   = DateOnly.FromDateTime(weekEnd),
            totalSessions   = sessions.Count,
            totalVolumeKg   = sessions.Sum(s => s.TotalVolumeLoadKg ?? 0),
            avgDurationSecs = sessions.Count > 0
                ? sessions.Average(s => s.TotalDurationSeconds ?? 0)
                : 0,
            totalXp         = xpTotal,
            questsCompleted,
            prCount,
            volumeByMuscle,
        });
    }
}
