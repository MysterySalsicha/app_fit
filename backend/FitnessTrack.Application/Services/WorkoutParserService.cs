using System.Text.RegularExpressions;
using FitnessTrack.Core.Entities;

namespace FitnessTrack.Application.Services;

public interface IWorkoutParserService
{
    WorkoutPlan Parse(string rawTxt, Guid userId);
}

/// <summary>
/// Parser de plano de treino em formato TXT livre.
/// Spec seção 5 — Módulo A: Parser TXT
/// </summary>
public class WorkoutParserService : IWorkoutParserService
{
    // Regex para detectar cabeçalho de dia
    private static readonly Regex DayHeaderRegex = new(
        @"(?:dia\s*)?(\d)\s*[-–—:]\s*(.+)",
        RegexOptions.IgnoreCase | RegexOptions.Compiled);

    // Regex para linha de exercício — suporta separadores: · (middle dot), | (pipe) ou - (hífen)
    // Formatos suportados:
    //   "Nome · 4x8-12 · 90s"   (formato legado com middle dot)
    //   "Nome | 4x8-12 | 90s"   (formato atual do template frontend)
    //   "Nome - 4x8-12 - 90s"   (formato alternativo com hífen)
    private static readonly Regex ExerciseLineRegex = new(
        @"^(?<name>[^·|\-\d][^·|]+?)\s*[·|\-]\s*(?<sets>\d+)\s*[xX]\s*(?<reps>[\d\-]+)\s*(?:[·|\-]\s*(?<rest>\d+)\s*s?)?",
        RegexOptions.Compiled);

    private static readonly Dictionary<string, string> MuscleKeywords = new(StringComparer.OrdinalIgnoreCase)
    {
        ["peito"] = "chest", ["chest"] = "chest",
        ["costas"] = "back_lat", ["back"] = "back_lat", ["lat"] = "back_lat",
        ["ombro"] = "shoulders", ["deltóide"] = "shoulders",
        ["bíceps"] = "biceps", ["biceps"] = "biceps",
        ["tríceps"] = "triceps", ["triceps"] = "triceps",
        ["quadríceps"] = "quads", ["quads"] = "quads",
        ["isquiotibiais"] = "hamstrings", ["femorais"] = "hamstrings",
        ["glúteos"] = "glutes", ["gluteos"] = "glutes",
        ["panturrilha"] = "calves",
        ["abdômen"] = "abs", ["abdomen"] = "abs", ["abdominal"] = "abs",
        ["trapézio"] = "traps",
    };

    public WorkoutPlan Parse(string rawTxt, Guid userId)
    {
        var plan = new WorkoutPlan
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Name = "Plano Importado",
            RawTxt = rawTxt,
            CreatedAt = DateTime.UtcNow,
        };

        var lines = rawTxt.Split('\n', StringSplitOptions.TrimEntries);
        WorkoutDay? currentDay = null;
        int exerciseOrder = 0;

        foreach (var line in lines)
        {
            if (string.IsNullOrWhiteSpace(line)) continue;

            // Tenta detectar cabeçalho de dia
            var dayMatch = DayHeaderRegex.Match(line);
            if (dayMatch.Success)
            {
                exerciseOrder = 0;
                bool isRestDay = line.Contains("descanso", StringComparison.OrdinalIgnoreCase)
                              || line.Contains("rest", StringComparison.OrdinalIgnoreCase);
                currentDay = new WorkoutDay
                {
                    Id = Guid.NewGuid(),
                    PlanId = plan.Id,
                    DayNumber = int.Parse(dayMatch.Groups[1].Value),
                    DayLabel = dayMatch.Groups[2].Value.Trim(),
                    MuscleGroups = dayMatch.Groups[2].Value.Trim(),
                    PrimaryMuscleGroup = DetectPrimaryMuscle(dayMatch.Groups[2].Value),
                    IsRestDay = isRestDay,
                    // Dias de descanso não requerem cardio por padrão
                    CardioRequired = !isRestDay,
                    CardioMinMinutes = isRestDay ? 0 : 45,
                };
                plan.Days.Add(currentDay);
                continue;
            }

            // Tenta detectar exercício
            if (currentDay != null && !currentDay.IsRestDay)
            {
                var exMatch = ExerciseLineRegex.Match(line);
                if (exMatch.Success)
                {
                    int restSeconds = 60;
                    if (exMatch.Groups["rest"].Success)
                        restSeconds = int.Parse(exMatch.Groups["rest"].Value);

                    var exercise = new Exercise
                    {
                        Id = Guid.NewGuid(),
                        DayId = currentDay.Id,
                        Name = exMatch.Groups["name"].Value.Trim(),
                        Sets = int.Parse(exMatch.Groups["sets"].Value),
                        Reps = exMatch.Groups["reps"].Value,
                        RestSeconds = restSeconds,
                        OrderIndex = exerciseOrder++,
                        PrimaryMuscleGroup = currentDay.PrimaryMuscleGroup,
                    };

                    currentDay.Exercises.Add(exercise);
                }
            }
        }

        // Fallback: se não detectou nenhum dia, cria um dia genérico
        if (!plan.Days.Any())
        {
            plan.Days.Add(new WorkoutDay
            {
                Id = Guid.NewGuid(),
                PlanId = plan.Id,
                DayNumber = 1,
                DayLabel = "Treino",
                MuscleGroups = "Geral",
                IsRestDay = false,
                CardioRequired = false,
                CardioMinMinutes = 0,
            });
        }

        return plan;
    }

    private static string? DetectPrimaryMuscle(string label)
    {
        foreach (var (kw, muscle) in MuscleKeywords)
        {
            if (label.Contains(kw, StringComparison.OrdinalIgnoreCase))
                return muscle;
        }
        return null;
    }
}
