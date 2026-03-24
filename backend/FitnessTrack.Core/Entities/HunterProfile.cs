namespace FitnessTrack.Core.Entities;

public class HunterProfile
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }

    // Rank
    public string HunterRank { get; set; } = "E";     // E D C B A S National
    public int HunterSubRank { get; set; } = 3;        // 3=fraco, 1=forte
    public int HunterLevel { get; set; } = 1;
    public long CurrentXp { get; set; } = 0;
    public long TotalXpEver { get; set; } = 0;

    // Classe
    public string HunterClass { get; set; } = "Balance Warrior";
    public DateTime ClassAssignedAt { get; set; } = DateTime.UtcNow;
    public int ClassChangesThisMonth { get; set; } = 0;

    // Atributos (spec seção 16)
    public int StatStr { get; set; } = 0;
    public int StatVit { get; set; } = 0;
    public int StatAgi { get; set; } = 0;
    public int StatInt { get; set; } = 0;
    public int StatPer { get; set; } = 0;
    public int StatPointsAvailable { get; set; } = 0;

    // Shadow Army (spec seção 23)
    public int ShadowIgrisLevel { get; set; } = 0;  // Streak de treino
    public int ShadowTankLevel { get; set; } = 0;   // Streak de volume
    public int ShadowIronLevel { get; set; } = 0;   // Streak de nutrição
    public int ShadowFangLevel { get; set; } = 0;   // Streak de cardio

    // Metas nutricionais diárias
    public int DailyKcalTarget { get; set; } = 2450;
    public float DailyProteinGTarget { get; set; } = 180;
    public float DailyCarbsGTarget { get; set; } = 220;
    public float DailyFatGTarget { get; set; } = 70;
    public int DailyWaterMlTarget { get; set; } = 3500;

    // Moedas
    public int ManaCrystals { get; set; } = 0;
    public int ImmunityTokens { get; set; } = 0;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public User User { get; set; } = null!;
    public ICollection<HunterSkill> Skills { get; set; } = new List<HunterSkill>();
    public ICollection<HunterTitle> Titles { get; set; } = new List<HunterTitle>();
    public ICollection<HunterQuest> Quests { get; set; } = new List<HunterQuest>();
    public ICollection<MuscleRank> MuscleRanks { get; set; } = new List<MuscleRank>();
}
