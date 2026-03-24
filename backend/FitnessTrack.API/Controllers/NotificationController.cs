using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FitnessTrack.Application.Services;
using System.Security.Claims;

namespace FitnessTrack.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotificationController : ControllerBase
{
    private readonly IPushNotificationService _push;
    private readonly IConfiguration _config;

    public NotificationController(IPushNotificationService push, IConfiguration config)
    {
        _push = push;
        _config = config;
    }

    private Guid UserId =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // ─── GET /api/notification/vapid-key ─────────────────────────────────
    /// <summary>
    /// Retorna a chave pública VAPID para o cliente registrar a subscription.
    /// </summary>
    [HttpGet("vapid-key")]
    [AllowAnonymous]
    public IActionResult GetVapidKey()
    {
        var key = _config["Vapid:PublicKey"];
        if (string.IsNullOrEmpty(key))
            return StatusCode(503, new { error = "Push notifications not configured" });

        return Ok(new { vapidPublicKey = key });
    }

    // ─── POST /api/notification/subscribe ────────────────────────────────
    /// <summary>
    /// Registra uma subscription Web Push do navegador.
    /// </summary>
    [HttpPost("subscribe")]
    public async Task<IActionResult> Subscribe([FromBody] SubscribeDto dto)
    {
        if (string.IsNullOrEmpty(dto.Endpoint))
            return BadRequest(new { error = "endpoint obrigatório" });

        var userAgent = Request.Headers["User-Agent"].ToString();
        await _push.SubscribeAsync(UserId, new SubscriptionDto(dto.Endpoint, dto.P256DhKey, dto.AuthKey), userAgent);

        return Ok(new { message = "Subscription registrada" });
    }

    // ─── DELETE /api/notification/subscribe ──────────────────────────────
    [HttpDelete("subscribe")]
    public async Task<IActionResult> Unsubscribe([FromBody] UnsubscribeDto dto)
    {
        await _push.UnsubscribeAsync(UserId, dto.Endpoint);
        return NoContent();
    }

    // ─── POST /api/notification/test ─────────────────────────────────────
    /// <summary>
    /// Envia uma notificação de teste para o usuário atual.
    /// </summary>
    [HttpPost("test")]
    public async Task<IActionResult> SendTest()
    {
        await _push.SendToUserAsync(UserId, new PushPayload(
            "⚔️ Sistema: Arise!",
            "As notificações do HunterFit estão funcionando. Prepare-se para subir de rank.",
            Tag: "test",
            Url: "/dashboard"
        ));
        return Ok(new { message = "Notificação de teste enviada" });
    }
}

public record SubscribeDto(string Endpoint, string P256DhKey, string AuthKey);
public record UnsubscribeDto(string Endpoint);
