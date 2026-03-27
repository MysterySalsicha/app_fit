namespace FitnessTrack.Core.Entities;

public class User
{
    public Guid Id { get; set; }
    public string Email { get; set; } = null!;
    public string PasswordHash { get; set; } = null!;
    public string Name { get; set; } = null!;
    public decimal HeightCm { get; set; }
    public long? StravaAthleteId { get; set; }
    public string? StravaAccessToken { get; set; }
    public string? StravaRefreshToken { get; set; }
    public DateTime? StravaTokenExpiresAt { get; set; }
    public string NotificationPreferences { get; set; } = "{}";
    public DateOnly? ChallengeStartDate { get; set; }
    public int TdeeCurrentEstimate { get; set; } = 2900;
    public string TdeeCalculationMethod { get; set; } = "formula";
    public int CaloricDeficitTarget { get; set; } = 400;
    public decimal TdeeConfidence { get; set; } = 0;
    // ── Onboarding / Profile (PARTE V) ─────────────────────────────────────
    public DateOnly? Birthdate { get; set; }
    public string? Sex { get; set; }            // "M" | "F" | "X"
    public string? FitnessGoal { get; set; }   // 'fat_loss' | 'muscle_gain' | 'strength' | 'maintenance' | 'recomposition' | 'return'
    public string? ExperienceLevel { get; set; } // 'beginner' | 'intermediate' | 'advanced' | 'athlete'
    public int PreferredDaysPerWeek { get; set; } = 4;
    public string? TrainingLocation { get; set; } // 'full_gym' | 'basic_gym' | 'home_equipment' | 'home_bodyweight' | 'outdoor'
    public string NotificationTone { get; set; } = "balanced"; // 'solo_leveling' | 'motivational' | 'minimal' | 'balanced'
    public string[] Injuries { get; set; } = [];
    public bool OnboardingCompleted { get; set; } = false;
    public DateTime? OnboardingCompletedAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Soft delete: quando preenchido, a conta está marcada para remoção.
    /// O email é anonimizado e os dados são removidos após 30 dias (LGPD).
    /// </summary>
    public DateTime? DeletedAt { get; set; }

    // Navigation
    public HunterProfile? HunterProfile { get; set; }
    public ICollection<WorkoutPlan> WorkoutPlans { get; set; } = new List<WorkoutPlan>();
    public ICollection<WorkoutSession> WorkoutSessions { get; set; } = new List<WorkoutSession>();
    public ICollection<Streak> Streaks { get; set; } = new List<Streak>();
}
