namespace FitnessTrack.Core.Entities;

// ── Onboarding Responses ───────────────────────────────────────────────────
public class OnboardingResponse
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string ResponsesJson { get; set; } = "{}";  // JSON answers for all 12 questions
    public string AiAnalysis { get; set; } = "{}";     // Processed profile from AI
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public User? User { get; set; }
}

// ── Sagas (training campaigns) ─────────────────────────────────────────────
public class Saga
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string SagaType { get; set; } = "custom";
        // 'cut' | 'bulk' | 'beginner_awakening' | 'strength_marathon'
        // | 'cardio_warrior' | 'rehab_warrior' | 'custom'
    public string SagaName { get; set; } = null!;
    public string? Description { get; set; }
    public int DurationDays { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? EndsAt { get; set; }
    public string Status { get; set; } = "pending";
        // 'pending' | 'active' | 'completed' | 'abandoned'
    public string GoalsJson { get; set; } = "{}";
    public string RewardsJson { get; set; } = "{}";
    public DateTime? CompletedAt { get; set; }
    public decimal ProgressPct { get; set; } = 0;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public User? User { get; set; }
}

// ── Long-term user goals ───────────────────────────────────────────────────
public class UserGoal
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string GoalType { get; set; } = null!;
    public string GoalDescription { get; set; } = null!;
    public decimal? TargetValue { get; set; }
    public decimal CurrentValue { get; set; } = 0;
    public string? Unit { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? AchievedAt { get; set; }
    public bool IsActive { get; set; } = true;

    // Navigation
    public User? User { get; set; }
}

// ── Weekly Goals (AI-generated) ────────────────────────────────────────────
public class WeeklyGoal
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public DateOnly WeekStart { get; set; }
    public string GoalsJson { get; set; } = "[]";
    public bool GeneratedByAi { get; set; } = true;
    public bool AcceptedByUser { get; set; } = false;
    public decimal CompletionPct { get; set; } = 0;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public User? User { get; set; }
}

// ── AI Coach Conversations ─────────────────────────────────────────────────
public class AiCoachConversation
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Role { get; set; } = null!;   // 'user' | 'assistant'
    public string Message { get; set; } = null!;
    public string? ContextSnapshot { get; set; }
    public int? TokensUsed { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public User? User { get; set; }
}

// ── Periodic Check-ins ─────────────────────────────────────────────────────
public class AiCheckin
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string CheckinType { get; set; } = null!;
        // 'weekly' | '30_days' | 'return_after_absence' | 'manual'
    public string QuestionsJson { get; set; } = "[]";
    public string? AnswersJson { get; set; }
    public string? AiAnalysis { get; set; }
    public string? AdaptationsMade { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public User? User { get; set; }
}

// ── AI Insights ────────────────────────────────────────────────────────────
public class AiInsight
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string InsightType { get; set; } = null!;
        // 'plateau' | 'overtraining' | 'imbalance' | 'nutrition_gap'
        // | 'progress' | 'weekly_analysis' | 'monthly_report'
    public string Title { get; set; } = null!;
    public string Body { get; set; } = null!;
    public string Severity { get; set; } = "info";   // 'info' | 'warning' | 'critical' | 'positive'
    public string? DataSnapshot { get; set; }
    public string? ActionsJson { get; set; }
    public DateTime? DismissedAt { get; set; }
    public bool ActedUpon { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public User? User { get; set; }
}
