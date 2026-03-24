namespace FitnessTrack.Core.Entities;

public class MuscleRank
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string MuscleGroup { get; set; } = null!;    // ex: chest, back_lat
    public string MuscleNamePt { get; set; } = null!;   // ex: Peito
    public string MuscleRankValue { get; set; } = "Untrained";
    public int MuscleRankNumeric { get; set; } = 0;     // 0–15
    public decimal TotalVolume30d { get; set; } = 0;
    public int Sessions30d { get; set; } = 0;
    public decimal? BestExercisePrKg { get; set; }
    public string? BestExerciseName { get; set; }
    public int RankUpCount { get; set; } = 0;
    public DateTime? LastRankUp { get; set; }

    public User User { get; set; } = null!;
}

public class ExercisePersonalRecord
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string ExerciseName { get; set; } = null!;
    public string? ExerciseCategory { get; set; }    // compound_heavy | compound_medium | bodyweight | isolation
    public string? PrimaryMuscleGroup { get; set; }
    public decimal? MaxWeightKg { get; set; }
    public int? MaxRepsAtMaxWeight { get; set; }
    public decimal? MaxVolumeSingleSet { get; set; }
    public int? MaxRepsBodyweight { get; set; }
    public int TimesBeaten { get; set; } = 0;
    public DateTime? LastBeatenAt { get; set; }
    public DateTime FirstLoggedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
}

public class HunterSkill
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string SkillId { get; set; } = null!;
    public string SkillType { get; set; } = null!;  // passive | real
    public string SkillName { get; set; } = null!;
    public string SkillRank { get; set; } = "Common";
    public string? EffectType { get; set; }
    public decimal? EffectValue { get; set; }
    public string? EffectTarget { get; set; }
    public DateTime UnlockedAt { get; set; } = DateTime.UtcNow;
    public bool IsActive { get; set; } = true;

    public User User { get; set; } = null!;
}

public class HunterTitle
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string TitleId { get; set; } = null!;
    public string TitleName { get; set; } = null!;
    public string TitleType { get; set; } = "permanent";
    public DateTime? ExpiresAt { get; set; }
    public bool Equipped { get; set; } = false;
    public DateTime EarnedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
}

public class XpEvent
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string EventType { get; set; } = null!;
    public int XpGained { get; set; }
    public decimal Multiplier { get; set; } = 1.0m;
    public string? Description { get; set; }
    public Guid? SourceId { get; set; }
    public string? ExerciseName { get; set; }
    public string? MuscleGroup { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
}

public class HunterQuest
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string QuestType { get; set; } = null!;
    public string? QuestKey { get; set; }
    public string Title { get; set; } = null!;
    public string? Description { get; set; }
    public string? Narrative { get; set; }
    public string Status { get; set; } = "active";
    public string ModulesJson { get; set; } = "{}";
    public int XpReward { get; set; } = 0;
    public int StatPointsReward { get; set; } = 0;
    public int CrystalReward { get; set; } = 0;
    public string? SkillReward { get; set; }
    public string? TitleReward { get; set; }
    public DateTime StartsAt { get; set; } = DateTime.UtcNow;
    public DateTime? ExpiresAt { get; set; }
    public DateTime? CompletedAt { get; set; }

    public User User { get; set; } = null!;
}

public class Streak
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string StreakType { get; set; } = null!;  // workout | diet | cardio | water
    public int CurrentCount { get; set; } = 0;
    public int MaxCount { get; set; } = 0;
    public DateOnly? LastValidDate { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
}
