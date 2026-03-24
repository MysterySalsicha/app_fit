using FitnessTrack.Core.Entities;
using FitnessTrack.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace FitnessTrack.Application.Services;

public interface IQuestService
{
    Task<List<HunterQuest>> GenerateDailyQuestsAsync(Guid userId);
    Task<bool> CompleteQuestAsync(Guid userId, Guid questId);
}

public class QuestService : IQuestService
{
    private static readonly List<DailyQuestTemplate> Templates = new()
    {
        new("workout_today",    "complete_workout",    "Enfrente a Dungeon", "Complete o treino de hoje.",            500,  0, 0),
        new("water_5l",         "drink_water",         "Hidratação do Hunter","Beba 5L de água.",                     100,  0, 5),
        new("protein_target",   "hit_protein",         "Cota de Proteína",   "Atinja a meta de proteína do dia.",    150,  0, 0),
        new("cardio_done",      "complete_cardio",     "Treinamento de AGI", "Complete 45min de cardio.",             200,  0, 0),
        new("log_all_meals",    "log_meals",           "Registro de Guerreiro","Registre todas as refeições do dia.", 80,   0, 0),
        new("volume_increase",  "volume_pr",           "Quebrar Limites",    "Aumente o volume total vs última sessão.",300, 1, 0),
    };

    private readonly AppDbContext _db;

    public QuestService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<List<HunterQuest>> GenerateDailyQuestsAsync(Guid userId)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        // Remove quests diárias antigas que ainda estão active
        var old = await _db.HunterQuests
            .Where(q => q.UserId == userId && q.QuestType == "daily" && q.Status == "active")
            .ToListAsync();

        foreach (var q in old) q.Status = "failed";

        // Gera 3 quests diárias aleatórias
        var selected = Templates.OrderBy(_ => Guid.NewGuid()).Take(3);
        var quests = new List<HunterQuest>();

        foreach (var tmpl in selected)
        {
            var quest = new HunterQuest
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                QuestType = "daily",
                QuestKey = tmpl.Key,
                Title = tmpl.Title,
                Description = tmpl.Description,
                Narrative = $"[Sistema]: {tmpl.Description}",
                Status = "active",
                ModulesJson = "{}",
                XpReward = tmpl.XpReward,
                StatPointsReward = tmpl.StatPoints,
                CrystalReward = tmpl.Crystals,
                StartsAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.Date.AddDays(1),
            };

            _db.HunterQuests.Add(quest);
            quests.Add(quest);
        }

        await _db.SaveChangesAsync();
        return quests;
    }

    public async Task<bool> CompleteQuestAsync(Guid userId, Guid questId)
    {
        var quest = await _db.HunterQuests
            .FirstOrDefaultAsync(q => q.Id == questId && q.UserId == userId && q.Status == "active");

        if (quest == null) return false;

        quest.Status = "completed";
        quest.CompletedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return true;
    }

    private record DailyQuestTemplate(
        string Key, string QuestKey, string Title, string Description,
        int XpReward, int StatPoints, int Crystals);
}
