using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FitnessTrack.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.ComponentModel.DataAnnotations;

namespace FitnessTrack.API.Controllers;

/// <summary>
/// CRUD de lembretes personalizados (TRT, suplemento, água, refeição, treino, cardio).
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class RemindersController : ControllerBase
{
    private readonly AppDbContext _db;

    public RemindersController(AppDbContext db) => _db = db;

    private Guid UserId =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // ─── GET /api/reminders ───────────────────────────────────────────────
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        // Reminders são armazenados em users.notification_preferences como JSONB
        // Para simplificar, retornamos os lembretes da tabela `reminders`
        // (criada no schema inicial mas sem entity EF — usamos raw query simples)
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == UserId);
        if (user is null) return NotFound();

        // Parse das preferências de notificação do JSONB
        return Ok(new
        {
            notificationPreferences = user.NotificationPreferences,
        });
    }

    // ─── PUT /api/reminders — Atualiza preferências ───────────────────────
    [HttpPut]
    public async Task<IActionResult> UpdatePreferences([FromBody] UpdateNotificationPreferencesDto dto)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == UserId);
        if (user is null) return NotFound();

        user.NotificationPreferences = dto.Preferences;
        await _db.SaveChangesAsync();

        return Ok(new { updated = true });
    }
}

public record UpdateNotificationPreferencesDto(
    [Required] string Preferences
);
