namespace FitnessTrack.Core.Entities;

public class WorkoutPlan
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Name { get; set; } = null!;
    public string? RawTxt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
    public ICollection<WorkoutDay> Days { get; set; } = new List<WorkoutDay>();
}

public class WorkoutDay
{
    public Guid Id { get; set; }
    public Guid PlanId { get; set; }
    public int DayNumber { get; set; }
    public string DayLabel { get; set; } = null!;
    public string MuscleGroups { get; set; } = null!;
    public string? PrimaryMuscleGroup { get; set; }
    public bool IsRestDay { get; set; } = false;
    public bool CardioRequired { get; set; } = true;
    public int CardioMinMinutes { get; set; } = 45;

    public WorkoutPlan Plan { get; set; } = null!;
    public ICollection<Exercise> Exercises { get; set; } = new List<Exercise>();
    public ICollection<WorkoutSession> Sessions { get; set; } = new List<WorkoutSession>();
}

public class Exercise
{
    public Guid Id { get; set; }
    public Guid DayId { get; set; }
    public string Name { get; set; } = null!;
    public int Sets { get; set; }
    public string Reps { get; set; } = null!;   // "8-12" ou "15"
    public int RestSeconds { get; set; } = 60;
    public string? GifUrl { get; set; }
    public string? Notes { get; set; }
    public int OrderIndex { get; set; }
    public string? PrimaryMuscleGroup { get; set; }
    public string? LastSessionData { get; set; }  // JSONB — cache offline

    public WorkoutDay Day { get; set; } = null!;
    public ICollection<ExerciseSet> Sets2 { get; set; } = new List<ExerciseSet>();
    public ICollection<ExerciseAlternative> Alternatives { get; set; } = new List<ExerciseAlternative>();
}

public class ExerciseAlternative
{
    public Guid Id { get; set; }
    public Guid ExerciseId { get; set; }
    public string AlternativeName { get; set; } = null!;
    public string? MuscleGroups { get; set; }
    public string? EquipmentRequired { get; set; }
    public int SimilarityScore { get; set; } = 80;
    public bool IsGlobal { get; set; } = true;

    public Exercise Exercise { get; set; } = null!;
}
