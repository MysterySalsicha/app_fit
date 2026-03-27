using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FitnessTrack.Application.Services;
using FitnessTrack.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace FitnessTrack.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class HunterController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IHunterProgressService _progress;
    private readonly IQuestService _quest;
    private readonly IPenaltyService _penalty;

    public HunterController(
        AppDbContext db,
        IHunterProgressService progress,
        IQuestService quest,
        IPenaltyService penalty)
    {
        _db = db;
        _progress = progress;
        _quest = quest;
        _penalty = penalty;
    }

    private Guid UserId =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    /// <summary>GET /api/hunter/profile — Perfil completo do Hunter</summary>
    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile()
    {
        var profile = await _db.HunterProfiles
            .FirstOrDefaultAsync(h => h.UserId == UserId);

        if (profile == null) return NotFound();

        var user = await _db.Users
            .Where(u => u.Id == UserId)
            .Select(u => new { u.OnboardingCompleted, u.Name })
            .FirstOrDefaultAsync();

        var equippedTitle = await _db.HunterTitles
            .Where(t => t.UserId == UserId && t.Equipped)
            .Select(t => t.TitleName)
            .FirstOrDefaultAsync();

        var streaks = await _db.Streaks
            .Where(s => s.UserId == UserId)
            .ToListAsync();

        // XP necessário para o próximo level
        var xpToNext = (long)Math.Floor(100 * Math.Pow(profile.HunterLevel + 1, 1.8));

        return Ok(new
        {
            hunterRank            = profile.HunterRank,
            hunterSubRank         = profile.HunterSubRank,
            hunterLevel           = profile.HunterLevel,
            currentXp             = profile.CurrentXp,
            totalXpEver           = profile.TotalXpEver,
            xpToNextLevel         = xpToNext,
            hunterClass           = profile.HunterClass,
            statStr               = profile.StatStr,
            statVit               = profile.StatVit,
            statAgi               = profile.StatAgi,
            statInt               = profile.StatInt,
            statPer               = profile.StatPer,
            statPointsAvailable   = profile.StatPointsAvailable,
            shadowIgrisLevel      = profile.ShadowIgrisLevel,
            shadowTankLevel       = profile.ShadowTankLevel,
            shadowIronLevel       = profile.ShadowIronLevel,
            shadowFangLevel       = profile.ShadowFangLevel,
            manaCrystals          = profile.ManaCrystals,
            immunityTokens        = profile.ImmunityTokens,
            equippedTitle,
            streaks,
            onboardingCompleted   = user?.OnboardingCompleted ?? false,
            name                  = user?.Name,
        });
    }

    /// <summary>GET /api/hunter/class — Classe atual</summary>
    [HttpGet("class")]
    public async Task<IActionResult> GetClass()
    {
        var profile = await _db.HunterProfiles.FirstOrDefaultAsync(h => h.UserId == UserId);
        if (profile is null) return NotFound();
        return Ok(new { currentClass = profile.HunterClass, classChangesThisMonth = profile.ClassChangesThisMonth });
    }

    /// <summary>POST /api/hunter/class — Muda classe</summary>
    [HttpPost("class")]
    public async Task<IActionResult> ChangeClass([FromBody] ChangeClassDto dto)
    {
        var profile = await _db.HunterProfiles.FirstOrDefaultAsync(h => h.UserId == UserId);
        if (profile is null) return NotFound();

        if (profile.ClassChangesThisMonth >= 1)
            return BadRequest(new { error = "Mudança mensal já utilizada" });

        profile.HunterClass = dto.HunterClass;
        profile.ClassChangesThisMonth++;
        await _db.SaveChangesAsync();
        return Ok(new { currentClass = profile.HunterClass });
    }

    /// <summary>POST /api/hunter/stat — Aloca ponto de atributo (atalho)</summary>
    [HttpPost("stat")]
    public async Task<IActionResult> AllocateStatShort([FromBody] AllocateStatShortDto dto)
    {
        var result = await _progress.AllocateStatPointAsync(UserId, dto.StatType);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>GET /api/hunter/muscle-ranks — Ranks musculares</summary>
    [HttpGet("muscle-ranks")]
    public async Task<IActionResult> GetMuscleRanks()
    {
        var muscles = await _db.MuscleRanks
            .Where(m => m.UserId == UserId)
            .ToListAsync();
        return Ok(new { muscles });
    }

    /// <summary>GET /api/hunter/quests — Quests ativas</summary>
    [HttpGet("quests")]
    public async Task<IActionResult> GetQuests()
    {
        var quests = await _db.HunterQuests
            .Where(q => q.UserId == UserId && q.Status == "active")
            .OrderBy(q => q.QuestType)
            .ToListAsync();

        return Ok(quests);
    }

    /// <summary>POST /api/hunter/quests/generate-daily — Gera quests diárias</summary>
    [HttpPost("quests/generate-daily")]
    public async Task<IActionResult> GenerateDailyQuests()
    {
        var quests = await _quest.GenerateDailyQuestsAsync(UserId);
        return Ok(quests);
    }

    /// <summary>GET /api/hunter/xp-history — Histórico de XP</summary>
    [HttpGet("xp-history")]
    public async Task<IActionResult> GetXpHistory([FromQuery] int days = 7)
    {
        var since = DateTime.UtcNow.AddDays(-days);
        var events = await _db.XpEvents
            .Where(e => e.UserId == UserId && e.CreatedAt >= since)
            .OrderByDescending(e => e.CreatedAt)
            .Take(50)
            .ToListAsync();

        return Ok(events);
    }

    /// <summary>POST /api/hunter/stats/allocate — Aloca ponto de atributo</summary>
    [HttpPost("stats/allocate")]
    public async Task<IActionResult> AllocateStat([FromBody] AllocateStatDto dto)
    {
        var result = await _progress.AllocateStatPointAsync(UserId, dto.Stat);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>GET /api/hunter/skills — Skills desbloqueadas</summary>
    [HttpGet("skills")]
    public async Task<IActionResult> GetSkills()
    {
        var skills = await _db.HunterSkills
            .Where(s => s.UserId == UserId && s.IsActive)
            .Select(s => new
            {
                s.Id,
                skillKey         = s.SkillId,   // frontend espera "skillKey"
                s.SkillName,
                skillDescription = s.EffectType, // fallback; idealmente adicionar campo description
                s.SkillRank,
                s.SkillType,
                s.UnlockedAt,
                s.IsActive,
                s.EffectType,
                s.EffectValue,
                s.EffectTarget,
            })
            .ToListAsync();

        // Wrapper necessário: frontend espera { skills: [...] }
        return Ok(new { skills });
    }

    /// <summary>GET /api/hunter/titles — Títulos do Hunter</summary>
    [HttpGet("titles")]
    public async Task<IActionResult> GetTitles()
    {
        var titles = await _db.HunterTitles
            .Where(t => t.UserId == UserId)
            .OrderByDescending(t => t.EarnedAt)
            .ToListAsync();

        return Ok(titles);
    }

    /// <summary>POST /api/hunter/titles/{titleId}/equip — Equipa título</summary>
    [HttpPost("titles/{titleId}/equip")]
    public async Task<IActionResult> EquipTitle(string titleId)
    {
        // Desequipa todos
        var all = await _db.HunterTitles
            .Where(t => t.UserId == UserId)
            .ToListAsync();

        foreach (var t in all) t.Equipped = false;

        var target = all.FirstOrDefault(t => t.TitleId == titleId);
        if (target == null) return NotFound();

        target.Equipped = true;
        await _db.SaveChangesAsync();

        return Ok(new { equipped = target.TitleName });
    }

    /// <summary>GET /api/hunter/penalty-status — Status da zona de penalidade</summary>
    [HttpGet("penalty-status")]
    public async Task<IActionResult> GetPenaltyStatus()
    {
        var status = await _penalty.GetPenaltyStatusAsync(UserId);
        return Ok(status);
    }
}

public record AllocateStatDto(string Stat);
public record ChangeClassDto(string HunterClass);
public record AllocateStatShortDto(string StatType);
