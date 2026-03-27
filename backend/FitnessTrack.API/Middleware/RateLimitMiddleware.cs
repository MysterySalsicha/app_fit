using System.Collections.Concurrent;
using System.Net;

namespace FitnessTrack.API.Middleware;

/// <summary>
/// Custom in-memory rate limiter for .NET 6.
/// Applies per-IP limits on specific auth routes to prevent brute-force attacks.
/// </summary>
public class RateLimitMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RateLimitMiddleware> _logger;

    // Key: "IP:path" → (attempt count, window start)
    private static readonly ConcurrentDictionary<string, (int Count, DateTime WindowStart)> _counters
        = new(StringComparer.OrdinalIgnoreCase);

    // Route-specific limits: path → (max requests, window in seconds)
    private static readonly Dictionary<string, (int MaxRequests, int WindowSeconds)> _limits
        = new(StringComparer.OrdinalIgnoreCase)
    {
        { "/api/auth/login",    (5, 60) },  // 5 attempts per minute
        { "/api/auth/register", (3, 60) },  // 3 attempts per minute
    };

    // Cleanup every 5 minutes to avoid unbounded memory growth
    private static DateTime _lastCleanup = DateTime.UtcNow;
    private static readonly object _cleanupLock = new();

    public RateLimitMiddleware(RequestDelegate next, ILogger<RateLimitMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var path = context.Request.Path.Value ?? string.Empty;
        var method = context.Request.Method;

        // Only rate-limit POST requests to auth routes
        if (method.Equals("POST", StringComparison.OrdinalIgnoreCase)
            && _limits.TryGetValue(path, out var limit))
        {
            var ip = GetClientIp(context);
            var key = $"{ip}:{path}";
            var now = DateTime.UtcNow;

            var entry = _counters.AddOrUpdate(
                key,
                _ => (1, now),
                (_, existing) =>
                {
                    // Reset window if expired
                    if ((now - existing.WindowStart).TotalSeconds >= limit.WindowSeconds)
                        return (1, now);

                    return (existing.Count + 1, existing.WindowStart);
                });

            if (entry.Count > limit.MaxRequests)
            {
                var retryAfter = (int)(limit.WindowSeconds - (now - entry.WindowStart).TotalSeconds) + 1;
                _logger.LogWarning(
                    "Rate limit exceeded for IP {Ip} on {Path}. Count: {Count}",
                    ip, path, entry.Count);

                context.Response.StatusCode = (int)HttpStatusCode.TooManyRequests;
                context.Response.Headers["Retry-After"] = retryAfter.ToString();
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsync(
                    $"{{\"error\":\"Muitas tentativas. Tente novamente em {retryAfter} segundos.\"}}");
                return;
            }
        }

        // Periodic cleanup of stale entries
        MaybeCleanup();

        await _next(context);
    }

    private static string GetClientIp(HttpContext context)
    {
        // Respect X-Forwarded-For if behind a proxy/load balancer
        var forwarded = context.Request.Headers["X-Forwarded-For"].FirstOrDefault();
        if (!string.IsNullOrEmpty(forwarded))
            return forwarded.Split(',')[0].Trim();

        return context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
    }

    private static void MaybeCleanup()
    {
        if ((DateTime.UtcNow - _lastCleanup).TotalMinutes < 5) return;

        lock (_cleanupLock)
        {
            if ((DateTime.UtcNow - _lastCleanup).TotalMinutes < 5) return;

            var cutoff = DateTime.UtcNow.AddMinutes(-5);
            foreach (var key in _counters.Keys.ToList())
            {
                if (_counters.TryGetValue(key, out var val) && val.WindowStart < cutoff)
                    _counters.TryRemove(key, out _);
            }

            _lastCleanup = DateTime.UtcNow;
        }
    }
}
