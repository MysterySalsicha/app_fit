using FitnessTrack.Core.Entities;
using FitnessTrack.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using System.Text;
using System.Text.Json;

namespace FitnessTrack.Application.Services;

public interface IPushNotificationService
{
    Task SubscribeAsync(Guid userId, SubscriptionDto dto, string? userAgent);
    Task UnsubscribeAsync(Guid userId, string endpoint);
    Task SendToUserAsync(Guid userId, PushPayload payload);
    Task SendToAllActiveAsync(PushPayload payload);
}

public record PushPayload(
    string Title,
    string Body,
    string? Icon  = null,
    string? Tag   = null,
    string? Url   = null,
    object? Data  = null
);

public record SubscriptionDto(string Endpoint, string P256DhKey, string AuthKey);

public class PushNotificationService : IPushNotificationService
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;
    private readonly HttpClient _http;

    public PushNotificationService(AppDbContext db, IConfiguration config, IHttpClientFactory httpFactory)
    {
        _db     = db;
        _config = config;
        _http   = httpFactory.CreateClient("vapid");
    }

    public async Task SubscribeAsync(Guid userId, SubscriptionDto dto, string? userAgent)
    {
        // Evita duplicatas pelo endpoint
        var existing = await _db.PushSubscriptions
            .FirstOrDefaultAsync(s => s.Endpoint == dto.Endpoint);

        if (existing is not null)
        {
            existing.UserId     = userId;
            existing.P256DhKey  = dto.P256DhKey;
            existing.AuthKey    = dto.AuthKey;
            existing.IsActive   = true;
            existing.UserAgent  = userAgent;
        }
        else
        {
            _db.PushSubscriptions.Add(new PushSubscription
            {
                Id        = Guid.NewGuid(),
                UserId    = userId,
                Endpoint  = dto.Endpoint,
                P256DhKey = dto.P256DhKey,
                AuthKey   = dto.AuthKey,
                UserAgent = userAgent,
            });
        }

        await _db.SaveChangesAsync();
    }

    public async Task UnsubscribeAsync(Guid userId, string endpoint)
    {
        var sub = await _db.PushSubscriptions
            .FirstOrDefaultAsync(s => s.UserId == userId && s.Endpoint == endpoint);

        if (sub is not null)
        {
            sub.IsActive = false;
            await _db.SaveChangesAsync();
        }
    }

    public async Task SendToUserAsync(Guid userId, PushPayload payload)
    {
        var subs = await _db.PushSubscriptions
            .Where(s => s.UserId == userId && s.IsActive)
            .ToListAsync();

        foreach (var sub in subs)
            await SendAsync(sub, payload);
    }

    public async Task SendToAllActiveAsync(PushPayload payload)
    {
        var subs = await _db.PushSubscriptions
            .Where(s => s.IsActive)
            .ToListAsync();

        foreach (var sub in subs)
            await SendAsync(sub, payload);
    }

    // ─── Helper: envia um push via Web Push Protocol ───────────────────────
    private async Task SendAsync(PushSubscription sub, PushPayload payload)
    {
        try
        {
            var body = JsonSerializer.Serialize(new
            {
                title   = payload.Title,
                body    = payload.Body,
                icon    = payload.Icon ?? "/icons/icon-192x192.png",
                badge   = "/icons/badge-72x72.png",
                tag     = payload.Tag ?? "hunterfit",
                data    = new { url = payload.Url ?? "/" },
            });

            // Em produção: usar WebPush library (WebPush NuGet) para assinar VAPID
            // Aqui enviamos o request raw — a assinatura VAPID deve ser feita pela lib
            var request = new HttpRequestMessage(HttpMethod.Post, sub.Endpoint)
            {
                Content = new StringContent(body, Encoding.UTF8, "application/json"),
            };

            var vapidPublicKey = _config["Vapid:PublicKey"] ?? "";
            request.Headers.Add("TTL", "86400");

            var response = await _http.SendAsync(request);

            if (response.StatusCode == System.Net.HttpStatusCode.Gone)
            {
                // Subscription expirou — desativa
                sub.IsActive = false;
                await _db.SaveChangesAsync();
            }
            else
            {
                sub.LastUsedAt = DateTime.UtcNow;
                await _db.SaveChangesAsync();
            }
        }
        catch (Exception ex)
        {
            // Loga e continua — não deixa uma falha afetar as outras subscriptions
            Console.Error.WriteLine($"[Push] Failed to send to {sub.Endpoint}: {ex.Message}");
        }
    }
}
