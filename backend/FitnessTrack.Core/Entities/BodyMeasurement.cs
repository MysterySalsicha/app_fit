namespace FitnessTrack.Core.Entities;

/// <summary>
/// Medição de composição corporal — manual ou via AI Vision (bioimpedância).
/// </summary>
public class BodyMeasurement
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }

    public DateTime MeasuredAt { get; set; } = DateTime.UtcNow;

    // Básico
    public decimal? WeightKg { get; set; }
    public decimal? BodyFatPct { get; set; }
    public decimal? MuscleMassKg { get; set; }
    public decimal? WaterPct { get; set; }
    public decimal? BoneMassKg { get; set; }
    public decimal? VisceralFatLevel { get; set; }
    public decimal? Bmi { get; set; }
    public decimal? BasalMetabolicRate { get; set; }   // kcal/dia

    // Circunferências (cm)
    public decimal? WaistCm { get; set; }
    public decimal? ChestCm { get; set; }
    public decimal? HipCm { get; set; }
    public decimal? ArmCm { get; set; }

    // Origem do dado
    public string Source { get; set; } = "manual"; // manual | ai_vision | import

    // Observações do usuário
    public string? Notes { get; set; }

    // AI validou os dados?
    public bool AiValidated { get; set; } = false;
    public string? AiRawJson { get; set; } // JSON bruto da visão IA

    // Navigation
    public User User { get; set; } = null!;
}
