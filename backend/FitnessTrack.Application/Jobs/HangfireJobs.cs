using FitnessTrack.Application.Services;
using FitnessTrack.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FitnessTrack.Application.Jobs;

/// <summary>
/// Jobs Hangfire para HunterFit.
/// Registrados em Program.cs via IRecurringJobManager.
///
/// Schedule (CRON):
///   DailyQuestGenerator   → "0 0 * * *"   (00:00 UTC diário)
///   StreakUpdateJob        → "0 6 * * *"   (06:00 UTC diário)
///   WaterReminderJob       → "0 */2 * * *" (a cada 2h)
///   PenaltyCheckJob        → "0 9 * * *"   (09:00 UTC diário)
/// </summary>
public class DailyQuestGeneratorJob
{
    private readonly AppDbContext _db;
    private readonly IQuestService _questService;
    private readonly ILogger<DailyQuestGeneratorJob> _logger;

    public DailyQuestGeneratorJob(AppDbContext db, IQuestService questService, ILogger<DailyQuestGeneratorJob> logger)
    {
        _db = db;
        _questService = questService;
        _logger = logger;
    }

    public async Task ExecuteAsync()
    {
        _logger.LogInformation("[Job] DailyQuestGenerator started at {Time}", DateTime.UtcNow);

        var userIds = await _db.Users
            .Select(u => u.Id)
            .ToListAsync();

        var generated = 0;
        foreach (var userId in userIds)
        {
            try
            {
                await _questService.GenerateDailyQuestsAsync(userId);
                generated++;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[Job] Failed to generate quests for user {UserId}", userId);
            }
        }

        _logger.LogInformation("[Job] DailyQuestGenerator finished — {Count} users processed", generated);
    }
}

public class StreakUpdateJob
{
    private readonly AppDbContext _db;
    private readonly IPushNotificationService _push;
    private readonly ILogger<StreakUpdateJob> logger;

    public StreakUpdateJob(AppDbContext db, IPushNotificationService push, ILogger<StreakUpdateJob> log)
    {
        _db = db;
        _push = push;
        logger = log;
    }

    public async Task ExecuteAsync()
    {
        logger.LogInformation("[Job] StreakUpdateJob started");

        // Identifica usuários que ficaram 1 dia sem treinar — alerta antes da penalidade
        var yesterday = DateTime.UtcNow.Date.AddDays(-1);

        var usersWithStreak = await _db.Streaks
            .Where(s => s.StreakType == "workout" && s.CurrentCount > 0)
            .Include(s => s.User)
            .ToListAsync();

        foreach (var streak in usersWithStreak)
        {
            if (streak.LastValidDate.HasValue)
            {
                var daysSince = (DateTime.UtcNow.Date - streak.LastValidDate.Value.Date).TotalDays;

                if (daysSince == 1)
                {
                    // Lembra o usuário de treinar hoje
                    await _push.SendToUserAsync(streak.UserId, new PushPayload(
                        "⚔️ Hora de treinar, Hunter!",
                        $"Sua streak de {streak.CurrentCount} dia(s) está em risco. Entre na dungeon!",
                        Tag: "streak-warning",
                        Url: "/workout"
                    ));
                }
                else if (daysSince >= 2)
                {
                    // Avisa que a penalidade está próxima
                    await _push.SendToUserAsync(streak.UserId, new PushPayload(
                        "🚨 Penalidade aproximando-se!",
                        $"Você ficou {daysSince:F0} dias sem treinar. {daysSince >= 3 ? "PENALIDADE ATIVA!" : "Treine hoje para evitar."}",
                        Tag: "penalty-warning",
                        Url: "/quests"
                    ));
                }
            }
        }

        logger.LogInformation("[Job] StreakUpdateJob finished");
    }
}

public class WaterReminderJob
{
    private readonly AppDbContext _db;
    private readonly IPushNotificationService _push;
    private readonly ILogger<WaterReminderJob> _logger;

    public WaterReminderJob(AppDbContext db, IPushNotificationService push, ILogger<WaterReminderJob> logger)
    {
        _db = db;
        _push = push;
        _logger = logger;
    }

    public async Task ExecuteAsync()
    {
        _logger.LogInformation("[Job] WaterReminderJob started");

        var today = DateTime.UtcNow.Date;

        // Usuários que têm menos de 50% da meta de água hoje
        var userIds = await _db.Users.Select(u => u.Id).ToListAsync();

        foreach (var userId in userIds)
        {
            var waterToday = await _db.NutritionLogs
                .Where(l => l.UserId == userId && l.LoggedAt.Date == today)
                .SumAsync(l => l.WaterMl);

            var profile = await _db.HunterProfiles
                .FirstOrDefaultAsync(p => p.UserId == userId);

            var target = profile?.DailyWaterMlTarget ?? 3500;

            if (waterToday < target * 0.5)
            {
                await _push.SendToUserAsync(userId, new PushPayload(
                    "💧 Beba água, Hunter!",
                    $"Você bebeu apenas {waterToday / 1000.0:F1}L hoje. Meta: {target / 1000.0:F1}L.",
                    Tag: "water-reminder",
                    Url: "/nutrition"
                ));
            }
        }

        _logger.LogInformation("[Job] WaterReminderJob finished");
    }
}

public class PenaltyCheckJob
{
    private readonly AppDbContext _db;
    private readonly IPenaltyService _penalty;
    private readonly ILogger<PenaltyCheckJob> _logger;

    public PenaltyCheckJob(AppDbContext db, IPenaltyService penalty, ILogger<PenaltyCheckJob> logger)
    {
        _db = db;
        _penalty = penalty;
        _logger = logger;
    }

    public async Task ExecuteAsync()
    {
        _logger.LogInformation("[Job] PenaltyCheckJob started");

        var userIds = await _db.Users.Select(u => u.Id).ToListAsync();

        foreach (var userId in userIds)
        {
            try
            {
                await _penalty.TriggerPenaltyIfNeededAsync(userId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[Job] Penalty check failed for user {UserId}", userId);
            }
        }

        _logger.LogInformation("[Job] PenaltyCheckJob finished");
    }
}

/// <summary>
/// Sincroniza atividades do Strava para todos os usuários conectados.
/// Schedule: "*/30 * * * *" (a cada 30 minutos).
/// </summary>
public class StravaSyncJob
{
    private readonly AppDbContext _db;
    private readonly IStravaService _strava;
    private readonly ILogger<StravaSyncJob> _logger;

    public StravaSyncJob(AppDbContext db, IStravaService strava, ILogger<StravaSyncJob> logger)
    {
        _db = db;
        _strava = strava;
        _logger = logger;
    }

    public async Task ExecuteAsync()
    {
        _logger.LogInformation("[Job] StravaSyncJob started");

        var connectedUserIds = await _db.Users
            .Where(u => u.StravaAccessToken != null)
            .Select(u => u.Id)
            .ToListAsync();

        var totalSynced = 0;

        foreach (var userId in connectedUserIds)
        {
            try
            {
                var synced = await _strava.SyncActivitiesAsync(userId);
                totalSynced += synced;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[Job] Strava sync failed for user {UserId}", userId);
            }
        }

        _logger.LogInformation("[Job] StravaSyncJob finished — {Count} activities synced", totalSynced);
    }
}
