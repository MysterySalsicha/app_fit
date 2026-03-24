namespace FitnessTrack.Core.Entities;

/// <summary>
/// Subscription Web Push de um dispositivo (VAPID).
/// </summary>
public class PushSubscription
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }

    public string Endpoint { get; set; } = "";
    public string P256DhKey { get; set; } = "";   // auth key do cliente
    public string AuthKey { get; set; } = "";      // encryption key do cliente

    public string? UserAgent { get; set; }
    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastUsedAt { get; set; }

    // Navigation
    public User User { get; set; } = null!;
}
