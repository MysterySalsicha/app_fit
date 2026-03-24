namespace FitnessTrack.Core.Entities;

public class NutritionLog
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }

    public string MealName { get; set; } = "";
    public int KcalConsumed { get; set; }
    public float ProteinG { get; set; }
    public float CarbsG { get; set; }
    public float FatG { get; set; }
    public int WaterMl { get; set; }       // 0 para refeições, >0 para água
    public string Source { get; set; } = "manual"; // manual | ai_vision | import

    public DateTime LoggedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public User User { get; set; } = null!;
}
