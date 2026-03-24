using System.ComponentModel.DataAnnotations;

namespace FitnessTrack.Application.DTOs;

public record RegisterDto(
    [Required, EmailAddress] string Email,
    [Required, MinLength(8)] string Password,
    [Required] string Name,
    [Range(100, 250)] decimal HeightCm
);

public record LoginDto(
    [Required, EmailAddress] string Email,
    [Required] string Password
);

public record CreatePlanDto(
    [Required] string Name,
    string? RawTxt
);

public record StartSessionDto(
    [Required] Guid DayId,
    string? DungeonType
);

public record LogSetDto(
    [Required] Guid ExerciseId,
    [Range(1, 20)] int SetNumber,
    [Range(0, 1000)] decimal WeightKg,
    [Range(1, 200)] int RepsDone,
    string? SetType = "normal",    // warmup | normal | drop_set | failure
    [Range(6.0, 10.0)] decimal? Rpe = null
);
