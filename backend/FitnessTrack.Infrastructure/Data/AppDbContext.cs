using FitnessTrack.Core.Entities;
using Microsoft.EntityFrameworkCore;

namespace FitnessTrack.Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    // ─── DbSets ───────────────────────────────────────────────────────────
    public DbSet<User> Users => Set<User>();
    public DbSet<WorkoutPlan> WorkoutPlans => Set<WorkoutPlan>();
    public DbSet<WorkoutDay> WorkoutDays => Set<WorkoutDay>();
    public DbSet<Exercise> Exercises => Set<Exercise>();
    public DbSet<ExerciseAlternative> ExerciseAlternatives => Set<ExerciseAlternative>();
    public DbSet<WorkoutSession> WorkoutSessions => Set<WorkoutSession>();
    public DbSet<ExerciseSet> ExerciseSets => Set<ExerciseSet>();
    public DbSet<HunterProfile> HunterProfiles => Set<HunterProfile>();
    public DbSet<MuscleRank> MuscleRanks => Set<MuscleRank>();
    public DbSet<ExercisePersonalRecord> ExercisePRs => Set<ExercisePersonalRecord>();
    public DbSet<HunterSkill> HunterSkills => Set<HunterSkill>();
    public DbSet<HunterTitle> HunterTitles => Set<HunterTitle>();
    public DbSet<XpEvent> XpEvents => Set<XpEvent>();
    public DbSet<HunterQuest> HunterQuests => Set<HunterQuest>();
    public DbSet<Streak> Streaks => Set<Streak>();
    public DbSet<NutritionLog> NutritionLogs => Set<NutritionLog>();
    public DbSet<BodyMeasurement> BodyMeasurements => Set<BodyMeasurement>();
    public DbSet<PushSubscription> PushSubscriptions => Set<PushSubscription>();
    public DbSet<OnboardingResponse> OnboardingResponses => Set<OnboardingResponse>();
    public DbSet<Saga> Sagas => Set<Saga>();
    public DbSet<UserGoal> UserGoals => Set<UserGoal>();
    public DbSet<WeeklyGoal> WeeklyGoals => Set<WeeklyGoal>();
    public DbSet<AiCoachConversation> AiCoachConversations => Set<AiCoachConversation>();
    public DbSet<AiCheckin> AiCheckins => Set<AiCheckin>();
    public DbSet<AiInsight> AiInsights => Set<AiInsight>();

    protected override void OnModelCreating(ModelBuilder model)
    {
        base.OnModelCreating(model);

        // ─── users ───────────────────────────────────────────────────────
        model.Entity<User>(e =>
        {
            e.ToTable("users");
            e.HasKey(u => u.Id);
            e.Property(u => u.Id).HasDefaultValueSql("uuid_generate_v4()");
            e.HasIndex(u => u.Email).IsUnique();
            e.Property(u => u.HeightCm).HasColumnType("decimal(5,2)");
            e.Property(u => u.TdeeConfidence).HasColumnType("decimal(3,2)");
        });

        // ─── hunter_profiles ──────────────────────────────────────────────
        model.Entity<HunterProfile>(e =>
        {
            e.ToTable("hunter_profiles");
            e.HasKey(h => h.Id);
            e.Property(h => h.Id).HasDefaultValueSql("uuid_generate_v4()");
            e.HasIndex(h => h.UserId).IsUnique();
            e.HasOne(h => h.User).WithOne(u => u.HunterProfile)
             .HasForeignKey<HunterProfile>(h => h.UserId);
        });

        // ─── workout_plans ────────────────────────────────────────────────
        model.Entity<WorkoutPlan>(e =>
        {
            e.ToTable("workout_plans");
            e.HasKey(p => p.Id);
            e.Property(p => p.Id).HasDefaultValueSql("uuid_generate_v4()");
            e.HasOne(p => p.User).WithMany(u => u.WorkoutPlans).HasForeignKey(p => p.UserId);
        });

        // ─── workout_days ─────────────────────────────────────────────────
        model.Entity<WorkoutDay>(e =>
        {
            e.ToTable("workout_days");
            e.HasKey(d => d.Id);
            e.Property(d => d.Id).HasDefaultValueSql("uuid_generate_v4()");
            e.HasOne(d => d.Plan).WithMany(p => p.Days).HasForeignKey(d => d.PlanId);
        });

        // ─── exercises ────────────────────────────────────────────────────
        model.Entity<Exercise>(e =>
        {
            e.ToTable("exercises");
            e.HasKey(ex => ex.Id);
            e.Property(ex => ex.Id).HasDefaultValueSql("uuid_generate_v4()");
            e.HasOne(ex => ex.Day).WithMany(d => d.Exercises).HasForeignKey(ex => ex.DayId);
        });

        // ─── exercise_alternatives ────────────────────────────────────────
        model.Entity<ExerciseAlternative>(e =>
        {
            e.ToTable("exercise_alternatives");
            e.HasKey(a => a.Id);
            e.Property(a => a.Id).HasDefaultValueSql("uuid_generate_v4()");
        });

        // ─── workout_sessions ─────────────────────────────────────────────
        model.Entity<WorkoutSession>(e =>
        {
            e.ToTable("workout_sessions");
            e.HasKey(s => s.Id);
            e.Property(s => s.Id).HasDefaultValueSql("uuid_generate_v4()");
            e.Property(s => s.TotalVolumeLoadKg).HasColumnType("decimal(10,2)");
            e.Property(s => s.XpMultiplier).HasColumnType("decimal(4,2)");
            e.Property(s => s.PrExercises).HasColumnType("text[]");
            e.HasOne(s => s.User).WithMany(u => u.WorkoutSessions).HasForeignKey(s => s.UserId);
            e.HasOne(s => s.Day).WithMany(d => d.Sessions).HasForeignKey(s => s.DayId);
        });

        // ─── exercise_sets ────────────────────────────────────────────────
        model.Entity<ExerciseSet>(e =>
        {
            e.ToTable("exercise_sets");
            e.HasKey(s => s.Id);
            e.Property(s => s.Id).HasDefaultValueSql("uuid_generate_v4()");
            e.Property(s => s.WeightKg).HasColumnType("decimal(6,2)");
            // Coluna gerada — EF Core trata como HasComputedColumnSql
            e.Property(s => s.VolumeLoadKg)
             .HasColumnType("decimal(8,2)")
             .HasComputedColumnSql("weight_kg * reps_done", stored: true);
            e.Property(s => s.Rpe).HasColumnType("decimal(3,1)");
            e.HasOne(s => s.Session).WithMany(ws => ws.Sets).HasForeignKey(s => s.SessionId);
            e.HasOne(s => s.Exercise).WithMany(ex => ex.Sets2).HasForeignKey(s => s.ExerciseId);
        });

        // ─── muscle_ranks ─────────────────────────────────────────────────
        model.Entity<MuscleRank>(e =>
        {
            e.ToTable("muscle_ranks");
            e.HasKey(mr => mr.Id);
            e.Property(mr => mr.Id).HasDefaultValueSql("uuid_generate_v4()");
            e.Property(mr => mr.MuscleRankValue).HasColumnName("muscle_rank");
            e.HasIndex(mr => new { mr.UserId, mr.MuscleGroup }).IsUnique();
        });

        // ─── exercise_personal_records ────────────────────────────────────
        model.Entity<ExercisePersonalRecord>(e =>
        {
            e.ToTable("exercise_personal_records");
            e.HasKey(pr => pr.Id);
            e.Property(pr => pr.Id).HasDefaultValueSql("uuid_generate_v4()");
            e.HasIndex(pr => new { pr.UserId, pr.ExerciseName }).IsUnique();
        });

        // ─── hunter_skills ────────────────────────────────────────────────
        model.Entity<HunterSkill>(e =>
        {
            e.ToTable("hunter_skills");
            e.HasKey(s => s.Id);
            e.Property(s => s.Id).HasDefaultValueSql("uuid_generate_v4()");
        });

        // ─── hunter_titles ────────────────────────────────────────────────
        model.Entity<HunterTitle>(e =>
        {
            e.ToTable("hunter_titles");
            e.HasKey(t => t.Id);
            e.Property(t => t.Id).HasDefaultValueSql("uuid_generate_v4()");
        });

        // ─── xp_events ────────────────────────────────────────────────────
        model.Entity<XpEvent>(e =>
        {
            e.ToTable("xp_events");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasDefaultValueSql("uuid_generate_v4()");
            e.Property(x => x.Multiplier).HasColumnType("decimal(4,2)");
        });

        // ─── hunter_quests ────────────────────────────────────────────────
        model.Entity<HunterQuest>(e =>
        {
            e.ToTable("hunter_quests");
            e.HasKey(q => q.Id);
            e.Property(q => q.Id).HasDefaultValueSql("uuid_generate_v4()");
        });

        // ─── streaks ──────────────────────────────────────────────────────
        model.Entity<Streak>(e =>
        {
            e.ToTable("streaks");
            e.HasKey(s => s.Id);
            e.Property(s => s.Id).HasDefaultValueSql("uuid_generate_v4()");
            e.HasOne(s => s.User).WithMany(u => u.Streaks).HasForeignKey(s => s.UserId);
        });

        // ─── push_subscriptions ───────────────────────────────────────────
        model.Entity<PushSubscription>(e =>
        {
            e.ToTable("push_subscriptions");
            e.HasKey(p => p.Id);
            e.Property(p => p.Id).HasDefaultValueSql("uuid_generate_v4()");
            e.HasIndex(p => p.Endpoint).IsUnique();
            e.HasIndex(p => new { p.UserId, p.IsActive });
            e.HasOne(p => p.User).WithMany().HasForeignKey(p => p.UserId);
        });

        // ─── body_measurements ────────────────────────────────────────────
        model.Entity<BodyMeasurement>(e =>
        {
            e.ToTable("body_measurements");
            e.HasKey(b => b.Id);
            e.Property(b => b.Id).HasDefaultValueSql("uuid_generate_v4()");
            e.Property(b => b.WeightKg).HasColumnType("decimal(5,2)");
            e.Property(b => b.BodyFatPct).HasColumnType("decimal(4,1)");
            e.Property(b => b.MuscleMassKg).HasColumnType("decimal(5,2)");
            e.Property(b => b.WaterPct).HasColumnType("decimal(4,1)");
            e.Property(b => b.BoneMassKg).HasColumnType("decimal(4,2)");
            e.Property(b => b.VisceralFatLevel).HasColumnType("decimal(4,1)");
            e.Property(b => b.Bmi).HasColumnType("decimal(4,1)");
            e.Property(b => b.BasalMetabolicRate).HasColumnType("decimal(6,1)");
            e.Property(b => b.WaistCm).HasColumnType("decimal(5,1)");
            e.Property(b => b.ChestCm).HasColumnType("decimal(5,1)");
            e.Property(b => b.HipCm).HasColumnType("decimal(5,1)");
            e.Property(b => b.ArmCm).HasColumnType("decimal(5,1)");
            e.HasIndex(b => new { b.UserId, b.MeasuredAt });
            e.HasOne(b => b.User).WithMany().HasForeignKey(b => b.UserId);
        });

        // ─── nutrition_logs ───────────────────────────────────────────────
        model.Entity<NutritionLog>(e =>
        {
            e.ToTable("nutrition_logs");
            e.HasKey(n => n.Id);
            e.Property(n => n.Id).HasDefaultValueSql("uuid_generate_v4()");
            e.Property(n => n.ProteinG).HasColumnType("real");
            e.Property(n => n.CarbsG).HasColumnType("real");
            e.Property(n => n.FatG).HasColumnType("real");
            e.HasIndex(n => new { n.UserId, n.LoggedAt });
            e.HasOne(n => n.User).WithMany().HasForeignKey(n => n.UserId);
        });

        // ─── onboarding_responses ─────────────────────────────────────────
        model.Entity<OnboardingResponse>(e =>
        {
            e.ToTable("onboarding_responses");
            e.HasKey(o => o.Id);
            e.Property(o => o.Id).HasDefaultValueSql("uuid_generate_v4()");
            e.HasIndex(o => o.UserId).IsUnique();
            e.HasOne(o => o.User).WithMany().HasForeignKey(o => o.UserId);
        });

        // ─── sagas ────────────────────────────────────────────────────────
        model.Entity<Saga>(e =>
        {
            e.ToTable("sagas");
            e.HasKey(s => s.Id);
            e.Property(s => s.Id).HasDefaultValueSql("uuid_generate_v4()");
            e.Property(s => s.ProgressPct).HasColumnType("decimal(5,2)");
            e.HasOne(s => s.User).WithMany().HasForeignKey(s => s.UserId);
        });

        // ─── user_goals ───────────────────────────────────────────────────
        model.Entity<UserGoal>(e =>
        {
            e.ToTable("user_goals");
            e.HasKey(g => g.Id);
            e.Property(g => g.Id).HasDefaultValueSql("uuid_generate_v4()");
            e.Property(g => g.TargetValue).HasColumnType("decimal(10,2)");
            e.Property(g => g.CurrentValue).HasColumnType("decimal(10,2)");
            e.HasOne(g => g.User).WithMany().HasForeignKey(g => g.UserId);
        });

        // ─── weekly_goals ─────────────────────────────────────────────────
        model.Entity<WeeklyGoal>(e =>
        {
            e.ToTable("weekly_goals");
            e.HasKey(w => w.Id);
            e.Property(w => w.Id).HasDefaultValueSql("uuid_generate_v4()");
            e.Property(w => w.CompletionPct).HasColumnType("decimal(5,2)");
            e.HasIndex(w => new { w.UserId, w.WeekStart }).IsUnique();
            e.HasOne(w => w.User).WithMany().HasForeignKey(w => w.UserId);
        });

        // ─── ai_coach_conversations ───────────────────────────────────────
        model.Entity<AiCoachConversation>(e =>
        {
            e.ToTable("ai_coach_conversations");
            e.HasKey(c => c.Id);
            e.Property(c => c.Id).HasDefaultValueSql("uuid_generate_v4()");
            e.HasOne(c => c.User).WithMany().HasForeignKey(c => c.UserId);
        });

        // ─── ai_checkins ──────────────────────────────────────────────────
        model.Entity<AiCheckin>(e =>
        {
            e.ToTable("ai_checkins");
            e.HasKey(c => c.Id);
            e.Property(c => c.Id).HasDefaultValueSql("uuid_generate_v4()");
            e.HasOne(c => c.User).WithMany().HasForeignKey(c => c.UserId);
        });

        // ─── ai_insights ──────────────────────────────────────────────────
        model.Entity<AiInsight>(e =>
        {
            e.ToTable("ai_insights");
            e.HasKey(i => i.Id);
            e.Property(i => i.Id).HasDefaultValueSql("uuid_generate_v4()");
            e.HasOne(i => i.User).WithMany().HasForeignKey(i => i.UserId);
        });
    }
}
