using FitnessTrack.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System.IO.Compression;
using System.Text;

namespace FitnessTrack.Application.Services;

public interface IExportService
{
    Task<byte[]> BuildZipExportAsync(Guid userId);
}

public class ExportService : IExportService
{
    private readonly AppDbContext _db;

    public ExportService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<byte[]> BuildZipExportAsync(Guid userId)
    {
        using var ms = new MemoryStream();
        using (var zip = new ZipArchive(ms, ZipArchiveMode.Create, leaveOpen: true))
        {
            AddEntry(zip, "body_measurements.csv",    await BuildBodyMeasurementsCsv(userId));
            AddEntry(zip, "workout_sessions.csv",     await BuildWorkoutSessionsCsv(userId));
            AddEntry(zip, "exercise_sets.csv",        await BuildExerciseSetsCsv(userId));
            AddEntry(zip, "daily_nutrition_logs.csv", await BuildNutritionLogsCsv(userId));
            AddEntry(zip, "water_intake_events.csv",  await BuildWaterEventsCsv(userId));
            AddEntry(zip, "streaks_history.csv",      await BuildStreaksCsv(userId));
            AddEntry(zip, "xp_events.csv",            await BuildXpEventsCsv(userId));
            AddEntry(zip, "muscle_ranks_history.csv", await BuildMuscleRanksCsv(userId));
        }

        ms.Seek(0, SeekOrigin.Begin);
        return ms.ToArray();
    }

    // ─── CSV Builders ──────────────────────────────────────────────────────────

    private async Task<string> BuildBodyMeasurementsCsv(Guid userId)
    {
        var rows = await _db.BodyMeasurements
            .Where(b => b.UserId == userId)
            .OrderBy(b => b.MeasuredAt)
            .Select(b => new
            {
                b.MeasuredAt,
                b.WeightKg,
                b.BodyFatPct,
                b.MuscleMassKg,
                b.WaterPct,
                b.Bmi,
                b.Source,
                b.AiValidated,
            })
            .ToListAsync();

        var sb = new StringBuilder();
        sb.AppendLine("measured_at,weight_kg,body_fat_pct,muscle_mass_kg,water_pct,bmi,source,ai_validated");
        foreach (var r in rows)
            sb.AppendLine($"{Iso(r.MeasuredAt)},{r.WeightKg},{r.BodyFatPct},{r.MuscleMassKg},{r.WaterPct},{r.Bmi},{r.Source},{r.AiValidated}");
        return sb.ToString();
    }

    private async Task<string> BuildWorkoutSessionsCsv(Guid userId)
    {
        var rows = await _db.WorkoutSessions
            .Where(s => s.UserId == userId)
            .OrderBy(s => s.SessionDate)
            .Select(s => new
            {
                s.Id,
                s.SessionDate,
                s.StartedAt,
                s.FinishedAt,
                s.TotalDurationSeconds,
                s.TotalVolumeLoadKg,
                s.XpEarned,
                s.DungeonType,
                s.DungeonCleared,
                s.PrBeaten,
            })
            .ToListAsync();

        var sb = new StringBuilder();
        sb.AppendLine("id,session_date,started_at,finished_at,duration_seconds,total_volume_kg,xp_earned,dungeon_type,dungeon_cleared,pr_beaten");
        foreach (var r in rows)
            sb.AppendLine($"{r.Id},{r.SessionDate},{Iso(r.StartedAt)},{Iso(r.FinishedAt)},{r.TotalDurationSeconds},{r.TotalVolumeLoadKg},{r.XpEarned},{r.DungeonType},{r.DungeonCleared},{r.PrBeaten}");
        return sb.ToString();
    }

    private async Task<string> BuildExerciseSetsCsv(Guid userId)
    {
        // Join through sessions to filter by user
        var sessionIds = await _db.WorkoutSessions
            .Where(s => s.UserId == userId)
            .Select(s => s.Id)
            .ToListAsync();

        var rows = await _db.ExerciseSets
            .Where(s => sessionIds.Contains(s.SessionId))
            .OrderBy(s => s.SessionId)
            .ThenBy(s => s.SetNumber)
            .Select(s => new
            {
                s.SessionId,
                s.ExerciseId,
                s.SetNumber,
                s.WeightKg,
                s.RepsDone,
                s.VolumeLoadKg,
                s.SetType,
                s.Rpe,
                s.CompletedAt,
            })
            .ToListAsync();

        var sb = new StringBuilder();
        sb.AppendLine("session_id,exercise_id,set_number,weight_kg,reps_done,volume_load_kg,set_type,rpe,completed_at");
        foreach (var r in rows)
            sb.AppendLine($"{r.SessionId},{r.ExerciseId},{r.SetNumber},{r.WeightKg},{r.RepsDone},{r.VolumeLoadKg},{r.SetType},{r.Rpe},{Iso(r.CompletedAt)}");
        return sb.ToString();
    }

    private async Task<string> BuildNutritionLogsCsv(Guid userId)
    {
        var rows = await _db.NutritionLogs
            .Where(n => n.UserId == userId)
            .OrderBy(n => n.LoggedAt)
            .Select(n => new
            {
                n.LoggedAt,
                n.MealName,
                n.KcalConsumed,
                n.ProteinG,
                n.CarbsG,
                n.FatG,
                n.WaterMl,
                n.Source,
            })
            .ToListAsync();

        var sb = new StringBuilder();
        sb.AppendLine("logged_at,meal_name,kcal_consumed,protein_g,carbs_g,fat_g,water_ml,source");
        foreach (var r in rows)
            sb.AppendLine($"{Iso(r.LoggedAt)},{CsvEscape(r.MealName)},{r.KcalConsumed},{r.ProteinG},{r.CarbsG},{r.FatG},{r.WaterMl},{r.Source}");
        return sb.ToString();
    }

    private async Task<string> BuildWaterEventsCsv(Guid userId)
    {
        // Export nutrition logs that have water (water_ml > 0) as water events
        var rows = await _db.NutritionLogs
            .Where(n => n.UserId == userId && n.WaterMl > 0)
            .OrderBy(n => n.LoggedAt)
            .Select(n => new { n.LoggedAt, n.WaterMl })
            .ToListAsync();

        var sb = new StringBuilder();
        sb.AppendLine("logged_at,amount_ml");
        foreach (var r in rows)
            sb.AppendLine($"{Iso(r.LoggedAt)},{r.WaterMl}");
        return sb.ToString();
    }

    private async Task<string> BuildStreaksCsv(Guid userId)
    {
        var rows = await _db.Streaks
            .Where(s => s.UserId == userId)
            .OrderBy(s => s.StreakType)
            .Select(s => new
            {
                s.StreakType,
                s.CurrentCount,
                s.MaxCount,
                s.LastValidDate,
                s.UpdatedAt,
            })
            .ToListAsync();

        var sb = new StringBuilder();
        sb.AppendLine("streak_type,current_count,max_count,last_valid_date,updated_at");
        foreach (var r in rows)
            sb.AppendLine($"{r.StreakType},{r.CurrentCount},{r.MaxCount},{r.LastValidDate},{Iso(r.UpdatedAt)}");
        return sb.ToString();
    }

    private async Task<string> BuildXpEventsCsv(Guid userId)
    {
        var rows = await _db.XpEvents
            .Where(x => x.UserId == userId)
            .OrderBy(x => x.CreatedAt)
            .Select(x => new
            {
                x.CreatedAt,
                x.EventType,
                x.XpGained,
                x.Multiplier,
                x.Description,
                x.ExerciseName,
                x.MuscleGroup,
            })
            .ToListAsync();

        var sb = new StringBuilder();
        sb.AppendLine("created_at,event_type,xp_gained,multiplier,description,exercise_name,muscle_group");
        foreach (var r in rows)
            sb.AppendLine($"{Iso(r.CreatedAt)},{r.EventType},{r.XpGained},{r.Multiplier},{CsvEscape(r.Description)},{CsvEscape(r.ExerciseName)},{r.MuscleGroup}");
        return sb.ToString();
    }

    private async Task<string> BuildMuscleRanksCsv(Guid userId)
    {
        var rows = await _db.MuscleRanks
            .Where(m => m.UserId == userId)
            .OrderBy(m => m.MuscleGroup)
            .Select(m => new
            {
                m.MuscleGroup,
                m.MuscleNamePt,
                Rank = m.MuscleRankValue,
                m.MuscleRankNumeric,
                m.TotalVolume30d,
                m.Sessions30d,
                m.BestExercisePrKg,
                m.BestExerciseName,
                m.RankUpCount,
                m.LastRankUp,
            })
            .ToListAsync();

        var sb = new StringBuilder();
        sb.AppendLine("muscle_group,muscle_name_pt,rank,rank_numeric,total_volume_30d,sessions_30d,best_pr_kg,best_exercise,rank_up_count,last_rank_up");
        foreach (var r in rows)
            sb.AppendLine($"{r.MuscleGroup},{CsvEscape(r.MuscleNamePt)},{r.Rank},{r.MuscleRankNumeric},{r.TotalVolume30d},{r.Sessions30d},{r.BestExercisePrKg},{CsvEscape(r.BestExerciseName)},{r.RankUpCount},{Iso(r.LastRankUp)}");
        return sb.ToString();
    }

    // ─── Helpers ───────────────────────────────────────────────────────────────

    private static void AddEntry(ZipArchive zip, string fileName, string content)
    {
        var entry = zip.CreateEntry(fileName, CompressionLevel.Optimal);
        using var writer = new StreamWriter(entry.Open(), Encoding.UTF8);
        writer.Write(content);
    }

    private static string Iso(DateTime? dt) =>
        dt?.ToString("yyyy-MM-ddTHH:mm:ssZ") ?? "";

    private static string Iso(DateOnly? d) =>
        d?.ToString("yyyy-MM-dd") ?? "";

    private static string Iso(DateTimeOffset? dt) =>
        dt?.ToString("yyyy-MM-ddTHH:mm:ssZ") ?? "";

    private static string CsvEscape(string? s)
    {
        if (string.IsNullOrEmpty(s)) return "";
        if (s.Contains(',') || s.Contains('"') || s.Contains('\n'))
            return $"\"{s.Replace("\"", "\"\"")}\"";
        return s;
    }
}
