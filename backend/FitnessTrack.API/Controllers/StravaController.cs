using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FitnessTrack.Application.Services;
using FitnessTrack.Infrastructure.Data;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;

namespace FitnessTrack.API.Controllers;

[ApiController]
[Route("api/strava")]
public class StravaController : ControllerBase
{
    private readonly IStravaService _strava;
    private readonly AppDbContext _db;

    public StravaController(IStravaService strava, AppDbContext db)
    {
        _strava = strava;
        _db = db;
    }

    private Guid? UserIdOrNull =>
        User.Identity?.IsAuthenticated == true
            ? Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : null
            : null;

    // ─── GET /api/strava/auth ─────────────────────────────────────────────
    /// <summary>
    /// Redireciona para o fluxo OAuth do Strava.
    /// </summary>
    [HttpGet("auth")]
    [Authorize]
    public IActionResult Authorize()
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var url    = _strava.GetAuthorizationUrl(userId);
        return Redirect(url);
    }

    // ─── GET /api/strava/callback ─────────────────────────────────────────
    /// <summary>
    /// Callback OAuth do Strava — troca o code pelo token e redireciona pro app.
    /// </summary>
    [HttpGet("callback")]
    public async Task<IActionResult> Callback([FromQuery] string code, [FromQuery] string state, [FromQuery] string? error)
    {
        if (!string.IsNullOrEmpty(error))
            return Redirect($"{GetFrontendUrl()}/settings?strava=denied");

        if (!Guid.TryParse(state, out var userId))
            return BadRequest(new { error = "state inválido" });

        var result = await _strava.ExchangeCodeAsync(code, userId);

        if (!result.Success)
            return Redirect($"{GetFrontendUrl()}/settings?strava=error");

        return Redirect($"{GetFrontendUrl()}/settings?strava=connected");
    }

    // ─── POST /api/strava/sync ────────────────────────────────────────────
    /// <summary>
    /// Sincronização manual. Também é chamado pelo Hangfire job.
    /// </summary>
    [HttpPost("sync")]
    [Authorize]
    public async Task<IActionResult> Sync()
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var synced = await _strava.SyncActivitiesAsync(userId);
        return Ok(new { activitiesSynced = synced });
    }

    // ─── GET /api/strava/status ───────────────────────────────────────────
    [HttpGet("status")]
    [Authorize]
    public async Task<IActionResult> GetStatus()
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var user = await _db.Users.FindAsync(userId);

        return Ok(new
        {
            connected     = user?.StravaAthleteId != null,
            athleteId     = user?.StravaAthleteId,
            tokenExpires  = user?.StravaTokenExpiresAt,
        });
    }

    // ─── DELETE /api/strava/disconnect ────────────────────────────────────
    [HttpDelete("disconnect")]
    [Authorize]
    public async Task<IActionResult> Disconnect()
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var user   = await _db.Users.FindAsync(userId);

        if (user is not null)
        {
            user.StravaAthleteId      = null;
            user.StravaAccessToken    = null;
            user.StravaRefreshToken   = null;
            user.StravaTokenExpiresAt = null;
            await _db.SaveChangesAsync();
        }

        return Ok(new { message = "Strava desconectado" });
    }

    private string GetFrontendUrl() =>
        Request.Headers["Origin"].FirstOrDefault()
        ?? "http://localhost:3000";
}
