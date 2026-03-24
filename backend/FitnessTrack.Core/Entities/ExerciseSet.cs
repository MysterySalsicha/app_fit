namespace FitnessTrack.Core.Entities;

public class ExerciseSet
{
    public Guid Id { get; set; }
    public Guid SessionId { get; set; }
    public Guid ExerciseId { get; set; }
    public int SetNumber { get; set; }
    public decimal? WeightKg { get; set; }
    public int? RepsDone { get; set; }
    // VolumeLoadKg é coluna gerada no PostgreSQL: GENERATED ALWAYS AS (weight_kg * reps_done) STORED
    // EF Core trata como coluna computada — não mapeamos com setter
    public decimal? VolumeLoadKg { get; private set; }
    public bool Completed { get; set; } = false;
    public DateTime? CompletedAt { get; set; }
    public DateTime? RestStartedAt { get; set; }

    // HEVY-01: tipo da série
    public string SetType { get; set; } = "normal"; // warmup | normal | drop_set | failure

    // HEVY RPE
    public decimal? Rpe { get; set; }

    // Navigation
    public WorkoutSession Session { get; set; } = null!;
    public Exercise Exercise { get; set; } = null!;
}
