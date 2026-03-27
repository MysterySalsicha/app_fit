using System.Collections.Concurrent;
using System.IdentityModel.Tokens.Jwt;

namespace FitnessTrack.API.Services;

/// <summary>
/// In-memory token blacklist for JWT revocation on logout.
/// Keyed by the token's JTI (unique identifier claim).
/// Self-cleaning: removes expired entries every 15 minutes.
///
/// Note: this is per-instance — in a multi-instance deployment,
/// use Redis or a database-backed blacklist instead.
/// </summary>
public interface ITokenBlacklistService
{
    void Revoke(string jti, DateTime expiresAt);
    bool IsRevoked(string jti);
}

public class TokenBlacklistService : ITokenBlacklistService
{
    // Key: JTI → expiry (so we can clean up)
    private static readonly ConcurrentDictionary<string, DateTime> _blacklist = new();
    private static DateTime _lastCleanup = DateTime.UtcNow;
    private static readonly object _cleanupLock = new();

    public void Revoke(string jti, DateTime expiresAt)
    {
        _blacklist.TryAdd(jti, expiresAt);
        MaybeCleanup();
    }

    public bool IsRevoked(string jti)
        => _blacklist.ContainsKey(jti);

    private static void MaybeCleanup()
    {
        if ((DateTime.UtcNow - _lastCleanup).TotalMinutes < 15) return;

        lock (_cleanupLock)
        {
            if ((DateTime.UtcNow - _lastCleanup).TotalMinutes < 15) return;

            var now = DateTime.UtcNow;
            foreach (var kv in _blacklist.ToArray())
            {
                if (kv.Value <= now)
                    _blacklist.TryRemove(kv.Key, out _);
            }

            _lastCleanup = now;
        }
    }
}
