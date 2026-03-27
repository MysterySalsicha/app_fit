using FitnessTrack.Core.Entities;
using FitnessTrack.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace FitnessTrack.Application.Services;

public interface ISkillDetectionService
{
    /// <summary>
    /// Check all real skills for a user and unlock any that have been earned.
    /// Should be called after a workout session is finished.
    /// Returns list of newly unlocked skill IDs.
    /// </summary>
    Task<IReadOnlyList<string>> CheckAndUnlockSkillsAsync(Guid userId);
}

/// <summary>
/// 10 real, verifiable skills from the spec.
/// Each skill has a concrete, measurable unlock condition based on actual logged data.
/// </summary>
public class SkillDetectionService : ISkillDetectionService
{
    private readonly AppDbContext _db;

    public SkillDetectionService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<string>> CheckAndUnlockSkillsAsync(Guid userId)
    {
        // Load existing real skills (avoid re-checking already unlocked ones)
        var existingSkillIds = (await _db.HunterSkills
            .Where(s => s.UserId == userId && s.SkillType == "real")
            .Select(s => s.SkillId)
            .ToListAsync())
            .ToHashSet();

        var newlyUnlocked = new List<string>();

        // Pre-load session IDs for this user — avoids navigation s.Session.UserId in sub-queries
        var userSessionIds = await _db.WorkoutSessions
            .Where(s => s.UserId == userId)
            .Select(s => s.Id)
            .ToListAsync();

        // ── 1. PULL-UP MASTERY — ≥10 reps in a single set of barra fixa ─────
        if (!existingSkillIds.Contains("pull_up_mastery"))
        {
            var pullUpExerciseIds = await _db.Exercises
                .Where(ex => ex.Name.ToLower().Contains("barra fixa")
                          || ex.Name.ToLower().Contains("pull-up")
                          || ex.Name.ToLower().Contains("pullup")
                          || ex.Name.ToLower().Contains("pull up")
                          || ex.Name.ToLower().Contains("chin-up"))
                .Select(ex => ex.Id)
                .ToListAsync();

            var earned = await _db.ExerciseSets
                .AnyAsync(s => userSessionIds.Contains(s.SessionId)
                            && pullUpExerciseIds.Contains(s.ExerciseId)
                            && s.RepsDone >= 10);

            if (earned) await Unlock(userId, "pull_up_mastery", "Pull-up Mastery",
                "Rare", "xp_multiplier", 1.15m, "back_lat", newlyUnlocked);
        }

        // ── 2. BENCH LORD — Bench press ≥ bodyweight ─────────────────────────
        if (!existingSkillIds.Contains("bench_lord"))
        {
            var latestWeight = await _db.BodyMeasurements
                .Where(b => b.UserId == userId && b.WeightKg != null)
                .OrderByDescending(b => b.MeasuredAt)
                .Select(b => b.WeightKg)
                .FirstOrDefaultAsync();

            if (latestWeight > 0)
            {
                var benchExerciseIds = await _db.Exercises
                    .Where(ex => ex.Name.ToLower().Contains("supino reto")
                              || ex.Name.ToLower().Contains("supino plano")
                              || ex.Name.ToLower().Contains("bench press"))
                    .Select(ex => ex.Id)
                    .ToListAsync();

                var earned = await _db.ExerciseSets
                    .AnyAsync(s => userSessionIds.Contains(s.SessionId)
                                && benchExerciseIds.Contains(s.ExerciseId)
                                && s.WeightKg >= latestWeight);

                if (earned) await Unlock(userId, "bench_lord", "Bench Lord",
                    "Rare", "xp_multiplier", 1.20m, "chest", newlyUnlocked);
            }
        }

        // ── 3. DEADLIFT GOD — Deadlift ≥ 1.5× bodyweight ────────────────────
        if (!existingSkillIds.Contains("deadlift_god"))
        {
            var latestWeight = await _db.BodyMeasurements
                .Where(b => b.UserId == userId && b.WeightKg != null)
                .OrderByDescending(b => b.MeasuredAt)
                .Select(b => b.WeightKg)
                .FirstOrDefaultAsync();

            if (latestWeight > 0)
            {
                var threshold = latestWeight * 1.5m;

                var deadliftExerciseIds = await _db.Exercises
                    .Where(ex => ex.Name.ToLower().Contains("levantamento terra")
                              || ex.Name.ToLower().Contains("deadlift")
                              || ex.Name.ToLower().Contains("terra"))
                    .Select(ex => ex.Id)
                    .ToListAsync();

                var earned = await _db.ExerciseSets
                    .AnyAsync(s => userSessionIds.Contains(s.SessionId)
                                && deadliftExerciseIds.Contains(s.ExerciseId)
                                && s.WeightKg >= threshold);

                if (earned) await Unlock(userId, "deadlift_god", "Deadlift God",
                    "Epic", "xp_multiplier", 1.25m, "back_lower", newlyUnlocked);
            }
        }

        // ── 4. IRON WILL — 30+ completed dungeons ────────────────────────────
        if (!existingSkillIds.Contains("iron_will"))
        {
            var count = await _db.WorkoutSessions
                .CountAsync(s => s.UserId == userId && s.FinishedAt != null);

            if (count >= 30) await Unlock(userId, "iron_will", "Iron Will",
                "Common", "xp_multiplier", 1.10m, "all", newlyUnlocked);
        }

        // ── 5. HYDRATION MASTER — 7 consecutive days ≥4000ml water ──────────
        if (!existingSkillIds.Contains("hydration_master"))
        {
            var waterByDay = await _db.NutritionLogs
                .Where(n => n.UserId == userId && n.WaterMl > 0)
                .GroupBy(n => n.LoggedAt.Date)
                .Select(g => new { Date = g.Key, Total = g.Sum(n => n.WaterMl) })
                .Where(d => d.Total >= 4000)
                .OrderBy(d => d.Date)
                .ToListAsync();

            if (Has7ConsecutiveDays(waterByDay.Select(d => d.Date)))
                await Unlock(userId, "hydration_master", "Hydration Master",
                    "Common", "stat_permanent", 2m, "vit", newlyUnlocked);
        }

        // ── 6. PROTEIN WARRIOR — 14 consecutive days ≥150g protein ──────────
        if (!existingSkillIds.Contains("protein_warrior"))
        {
            var proteinByDay = await _db.NutritionLogs
                .Where(n => n.UserId == userId)
                .GroupBy(n => n.LoggedAt.Date)
                .Select(g => new { Date = g.Key, Total = g.Sum(n => (decimal)n.ProteinG) })
                .Where(d => d.Total >= 150)
                .OrderBy(d => d.Date)
                .ToListAsync();

            if (HasNConsecutiveDays(proteinByDay.Select(d => d.Date), 14))
                await Unlock(userId, "protein_warrior", "Protein Warrior",
                    "Common", "xp_multiplier", 1.10m, "nutrition", newlyUnlocked);
        }

        // ── 7. SQUAT KING — Back squat ≥ bodyweight × 5 reps ────────────────
        if (!existingSkillIds.Contains("squat_king"))
        {
            var latestWeight = await _db.BodyMeasurements
                .Where(b => b.UserId == userId && b.WeightKg != null)
                .OrderByDescending(b => b.MeasuredAt)
                .Select(b => b.WeightKg)
                .FirstOrDefaultAsync();

            if (latestWeight > 0)
            {
                var squatExerciseIds = await _db.Exercises
                    .Where(ex => ex.Name.ToLower().Contains("agachamento livre")
                              || ex.Name.ToLower().Contains("back squat")
                              || ex.Name.ToLower().Contains("agachamento barra"))
                    .Select(ex => ex.Id)
                    .ToListAsync();

                var earned = await _db.ExerciseSets
                    .AnyAsync(s => userSessionIds.Contains(s.SessionId)
                                && squatExerciseIds.Contains(s.ExerciseId)
                                && s.WeightKg >= latestWeight
                                && s.RepsDone >= 5);

                if (earned) await Unlock(userId, "squat_king", "Squat King",
                    "Rare", "xp_multiplier", 1.20m, "quads", newlyUnlocked);
            }
        }

        // ── 8. CARDIO CHAMPION — Cardio streak max ≥7 days ──────────────────
        if (!existingSkillIds.Contains("cardio_champion"))
        {
            var cardioStreak = await _db.Streaks
                .FirstOrDefaultAsync(s => s.UserId == userId && s.StreakType == "cardio");

            if (cardioStreak?.MaxCount >= 7)
                await Unlock(userId, "cardio_champion", "Cardio Champion",
                    "Rare", "stat_permanent", 3m, "agi", newlyUnlocked);
        }

        // ── 9. VOLUME MONSTER — Single session ≥20,000kg volume load ────────
        if (!existingSkillIds.Contains("volume_monster"))
        {
            var earned = await _db.WorkoutSessions
                .AnyAsync(s => s.UserId == userId && s.TotalVolumeLoadKg >= 20000);

            if (earned) await Unlock(userId, "volume_monster", "Volume Monster",
                "Epic", "xp_multiplier", 1.30m, "volume", newlyUnlocked);
        }

        // ── 10. THE UNBROKEN — Workout streak max ≥20 days ──────────────────
        if (!existingSkillIds.Contains("the_unbroken"))
        {
            var workoutStreak = await _db.Streaks
                .FirstOrDefaultAsync(s => s.UserId == userId && s.StreakType == "workout");

            if (workoutStreak?.MaxCount >= 20)
                await Unlock(userId, "the_unbroken", "The Unbroken",
                    "Legendary", "xp_multiplier", 1.50m, "all", newlyUnlocked);
        }

        return newlyUnlocked;
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private async Task Unlock(
        Guid userId,
        string skillId,
        string name,
        string rank,
        string effectType,
        decimal effectValue,
        string effectTarget,
        List<string> tracker)
    {
        _db.HunterSkills.Add(new HunterSkill
        {
            UserId       = userId,
            SkillId      = skillId,
            SkillType    = "real",
            SkillName    = name,
            SkillRank    = rank,
            EffectType   = effectType,
            EffectValue  = effectValue,
            EffectTarget = effectTarget,
        });

        await _db.SaveChangesAsync();
        tracker.Add(skillId);
    }

    private static bool Has7ConsecutiveDays(IEnumerable<DateTime> dates) =>
        HasNConsecutiveDays(dates, 7);

    private static bool HasNConsecutiveDays(IEnumerable<DateTime> dates, int n)
    {
        var sorted = dates.OrderBy(d => d).ToList();
        if (sorted.Count < n) return false;

        int streak = 1;
        for (int i = 1; i < sorted.Count; i++)
        {
            if ((sorted[i] - sorted[i - 1]).Days == 1)
            {
                streak++;
                if (streak >= n) return true;
            }
            else
            {
                streak = 1;
            }
        }
        return false;
    }
}
