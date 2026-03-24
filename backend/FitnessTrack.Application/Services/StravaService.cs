using FitnessTrack.Core.Entities;
using FitnessTrack.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Text.Json;
using System.Net.Http.Headers;

namespace FitnessTrack.Application.Services;

public interface IStravaService
{
    string GetAuthorizationUrl(Guid userId);
    Task<StravaTokenResult> ExchangeCodeAsync(string code, Guid userId);
    Task<int> SyncActivitiesAsync(Guid userId);
}

public record StravaTokenResult(bool Success, string? Error = null);

public class StravaService : IStravaService
{
    private readonly HttpClient _http;
    private readonly IConfiguration _config;
    private readonly AppDbContext _db;
    private readonly IStreakService _streakService;
    private readonly ILogger<StravaService> _logger;

    private const int CARDIO_MIN_SECONDS  = 2700; // 45 min
    private const int CARDIO_MIN_METERS   = 1000;  // 1 km

    public StravaService(
        IHttpClientFactory httpFactory,
        IConfiguration config,
        AppDbContext db,
        IStreakService streakService,
        ILogger<StravaService> logger)
    {
        _http         = httpFactory.CreateClient("strava");
        _config       = config;
        _db           = db;
        _streakService = streakService;
        _logger       = logger;
    }

    // ─── OAuth Authorization URL ───────────────────────────────────────────
    public string GetAuthorizationUrl(Guid userId)
    {
        var clientId    = _config["Strava:ClientId"];
        var redirectUri = _config["Strava:RedirectUri"];
        var scope       = "read,activity:read_all";

        return $"https://www.strava.com/oauth/authorize" +
               $"?client_id={clientId}" +
               $"&response_type=code" +
               $"&redirect_uri={Uri.EscapeDataString(redirectUri!)}" +
               $"&approval_prompt=force" +
               $"&scope={scope}" +
               $"&state={userId}";
    }

    // ─── Exchange authorization code for tokens ────────────────────────────
    public async Task<StravaTokenResult> ExchangeCodeAsync(string code, Guid userId)
    {
        try
        {
            var tokenResponse = await _http.PostAsync(
                "https://www.strava.com/oauth/token",
                new FormUrlEncodedContent(new Dictionary<string, string>
                {
                    ["client_id"]     = _config["Strava:ClientId"]!,
                    ["client_secret"] = _config["Strava:ClientSecret"]!,
                    ["code"]          = code,
                    ["grant_type"]    = "authorization_code",
                })
            );

            if (!tokenResponse.IsSuccessStatusCode)
                return new StravaTokenResult(false, "Failed to exchange code");

            var tokenJson = await tokenResponse.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(tokenJson);
            var root = doc.RootElement;

            var accessToken  = root.GetProperty("access_token").GetString()!;
            var refreshToken = root.GetProperty("refresh_token").GetString()!;
            var expiresAt    = DateTimeOffset.FromUnixTimeSeconds(root.GetProperty("expires_at").GetInt64()).UtcDateTime;
            var athleteId    = root.GetProperty("athlete").GetProperty("id").GetInt64();

            // Persiste na tabela de usuários
            var user = await _db.Users.FindAsync(userId);
            if (user is null) return new StravaTokenResult(false, "User not found");

            user.StravaAthleteId    = athleteId;
            user.StravaAccessToken  = accessToken;
            user.StravaRefreshToken = refreshToken;
            user.StravaTokenExpiresAt = expiresAt;

            await _db.SaveChangesAsync();

            _logger.LogInformation("[Strava] Authorized for user {UserId} — athlete {AthleteId}", userId, athleteId);
            return new StravaTokenResult(true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[Strava] OAuth exchange failed for user {UserId}", userId);
            return new StravaTokenResult(false, ex.Message);
        }
    }

    // ─── Sync Activities ────────────────────────────────────────────────────
    public async Task<int> SyncActivitiesAsync(Guid userId)
    {
        var user = await _db.Users.FindAsync(userId);
        if (user?.StravaAccessToken is null) return 0;

        // Refresh token if expired
        if (user.StravaTokenExpiresAt.HasValue && user.StravaTokenExpiresAt.Value <= DateTime.UtcNow)
        {
            var refreshed = await RefreshTokenAsync(user);
            if (!refreshed) return 0;
        }

        // Busca atividades das últimas 24h
        var since = DateTimeOffset.UtcNow.AddHours(-25).ToUnixTimeSeconds();
        var request = new HttpRequestMessage(
            HttpMethod.Get,
            $"https://www.strava.com/api/v3/athlete/activities?after={since}&per_page=30"
        );
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", user.StravaAccessToken);

        var response = await _http.SendAsync(request);
        if (!response.IsSuccessStatusCode) return 0;

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        int synced = 0;

        foreach (var activity in doc.RootElement.EnumerateArray())
        {
            var activityType    = activity.GetProperty("type").GetString() ?? "";
            var durationSeconds = activity.TryGetProperty("moving_time", out var dt) ? dt.GetInt32() : 0;
            var distanceMeters  = activity.TryGetProperty("distance", out var dm) ? dm.GetDouble() : 0;
            var startDate       = activity.TryGetProperty("start_date", out var sd)
                ? DateTime.Parse(sd.GetString()!)
                : DateTime.UtcNow;
            var stravaId        = activity.GetProperty("id").GetInt64();

            // Filtra atividades válidas como cardio
            bool isCardio = IsCardioActivity(activityType) &&
                            durationSeconds >= CARDIO_MIN_SECONDS &&
                            distanceMeters  >= CARDIO_MIN_METERS;

            if (!isCardio) continue;

            // Evita duplicatas pelo ID do Strava
            var alreadySynced = await _db.WorkoutSessions
                .AnyAsync(s => s.StravaActivityId == stravaId);

            if (alreadySynced) continue;

            // Registra como sessão de cardio
            var session = new WorkoutSession
            {
                Id                  = Guid.NewGuid(),
                UserId              = userId,
                DayId               = Guid.Empty, // Cardio — sem day
                SessionDate         = startDate,
                TotalDurationSeconds = durationSeconds,
                DungeonType         = "normal",
                DungeonCleared      = true,
                XpEarned            = CalculateCardioXp(durationSeconds, distanceMeters),
                Source              = "strava",
                StravaActivityId    = stravaId,
            };

            _db.WorkoutSessions.Add(session);

            // Atualiza streak de cardio + Fang
            await _streakService.UpdateStreakAsync(userId, "cardio", startDate);
            synced++;
        }

        if (synced > 0)
            await _db.SaveChangesAsync();

        _logger.LogInformation("[Strava] Synced {Count} activities for user {UserId}", synced, userId);
        return synced;
    }

    // ─── Helpers ───────────────────────────────────────────────────────────
    private static bool IsCardioActivity(string type) =>
        type is "Run" or "Walk" or "Ride" or "VirtualRide" or "Swim" or
                "Hike" or "Rowing" or "Elliptical" or "StairStepper";

    private static int CalculateCardioXp(int durationSeconds, double distanceMeters)
    {
        // XP = 5 kcal/min equivalente (30s ≈ 2.5 XP base)
        var minutes = durationSeconds / 60.0;
        return (int)Math.Round(minutes * 5);
    }

    private async Task<bool> RefreshTokenAsync(User user)
    {
        try
        {
            var resp = await _http.PostAsync(
                "https://www.strava.com/oauth/token",
                new FormUrlEncodedContent(new Dictionary<string, string>
                {
                    ["client_id"]     = _config["Strava:ClientId"]!,
                    ["client_secret"] = _config["Strava:ClientSecret"]!,
                    ["grant_type"]    = "refresh_token",
                    ["refresh_token"] = user.StravaRefreshToken!,
                })
            );

            if (!resp.IsSuccessStatusCode) return false;

            var json = await resp.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;

            user.StravaAccessToken    = root.GetProperty("access_token").GetString();
            user.StravaRefreshToken   = root.GetProperty("refresh_token").GetString();
            user.StravaTokenExpiresAt = DateTimeOffset.FromUnixTimeSeconds(root.GetProperty("expires_at").GetInt64()).UtcDateTime;

            await _db.SaveChangesAsync();
            return true;
        }
        catch
        {
            return false;
        }
    }
}
