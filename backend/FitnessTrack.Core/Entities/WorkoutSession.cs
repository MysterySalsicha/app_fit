namespace FitnessTrack.Core.Entities;

public class WorkoutSession
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid DayId { get; set; }
    public DateOnly SessionDate { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? FinishedAt { get; set; }
    public int? TotalDurationSeconds { get; set; }
    public decimal? TotalVolumeLoadKg { get; set; }
    public decimal? PrevSessionVolumeKg { get; set; }
    public string SyncStatus { get; set; } = "synced";
    public string? OfflinePayload { get; set; }
    public long? StravaActivityId { get; set; }
    public string Source { get; set; } = "manual"; // manual | strava | import

    // RPG
    public string DungeonType { get; set; } = "normal";
    public int XpEarned { get; set; } = 0;
    public bool PrBeaten { get; set; } = false;
    public string[]? PrExercises { get; set; }
    public decimal XpMultiplier { get; set; } = 1.0m;
    public bool DungeonCleared { get; set; } = false;

    // Navigation
    public User User { get; set; } = null!;
    public WorkoutDay Day { get; set; } = null!;
    public ICollection<ExerciseSet> Sets { get; set; } = new List<ExerciseSet>();
}
