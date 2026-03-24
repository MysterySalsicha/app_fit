using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FitnessTrack.Application.Services;
using FitnessTrack.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text.Json;

namespace FitnessTrack.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class QuestsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IQuestService _questService;
    private readonly IHunterProgressService _progress;

    public QuestsController(AppDbContext db, IQuestService questService, IHunterProgressService progress)
    {
        _db = db;
        _questService = questService;
        _progress = progress;
    }

    private Guid UserId =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // ─── GET /api/quests ──────────────────────────────────────────────────
    /// <summary>
    /// Retorna quests agrupadas por tipo.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var today = DateTime.UtcNow.Date;
        var userId = UserId;

        var all = await _db.HunterQuests
            .Where(q => q.UserId == userId &&
                        (q.ExpiresAt == null || q.ExpiresAt >= today))
            .OrderBy(q => q.Status)
            .ThenBy(q => q.QuestType)
            .ToListAsync();

        var daily         = all.Where(q => q.QuestType == "daily").ToList();
        var main          = all.Where(q => q.QuestType == "main").ToList();
        var emergency     = all.Where(q => q.QuestType == "emergency").ToList();
        var penaltyRescue = all.FirstOrDefault(q => q.QuestType == "penalty_rescue" && q.Status == "active");

        return Ok(new { daily, main, emergency, penaltyRescue });
    }

    // ─── POST /api/quests/{questId}/complete ──────────────────────────────
    /// <summary>
    /// Completa uma quest e aplica as recompensas.
    /// </summary>
    [HttpPost("{questId:guid}/complete")]
    public async Task<IActionResult> Complete(Guid questId)
    {
        var quest = await _db.HunterQuests
            .FirstOrDefaultAsync(q => q.Id == questId && q.UserId == UserId);

        if (quest is null) return NotFound();
        if (quest.Status != "active") return BadRequest(new { error = "Quest não está ativa" });

        // Verifica se os módulos estão completos (validação simples)
        // Em produção: validar contra os dados reais do usuário
        quest.Status    = "completed";
        quest.CompletedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        // Aplica recompensas
        if (quest.XpReward > 0)
            await _progress.AddXpAsync(UserId, quest.XpReward);

        var profile = await _db.HunterProfiles.FirstOrDefaultAsync(p => p.UserId == UserId);
        if (profile is not null)
        {
            if (quest.StatPointsReward > 0)
            {
                profile.StatPointsAvailable += quest.StatPointsReward;
                await _db.SaveChangesAsync();
            }
            if (quest.CrystalReward > 0)
            {
                profile.ManaCrystals += quest.CrystalReward;
                await _db.SaveChangesAsync();
            }
        }

        return Ok(new
        {
            questId   = quest.Id,
            xpGained  = quest.XpReward,
            statPts   = quest.StatPointsReward,
            crystals  = quest.CrystalReward,
        });
    }

    // ─── POST /api/quests/generate-daily ─────────────────────────────────
    [HttpPost("generate-daily")]
    public async Task<IActionResult> GenerateDaily()
    {
        var quests = await _questService.GenerateDailyQuestsAsync(UserId);
        return Ok(quests);
    }
}
