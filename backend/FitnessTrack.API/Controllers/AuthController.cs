using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using FitnessTrack.Application.DTOs;
using FitnessTrack.Infrastructure.Data;
using FitnessTrack.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace FitnessTrack.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;

    public AuthController(AppDbContext db, IConfiguration config)
    {
        _db = db;
        _config = config;
    }

    // ─── POST /api/auth/register ──────────────────────────────────────────
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto dto)
    {
        if (await _db.Users.AnyAsync(u => u.Email == dto.Email.ToLowerInvariant()))
            return Conflict(new { error = "Email já cadastrado." });

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = dto.Email.ToLowerInvariant(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Name = dto.Name,
            HeightCm = dto.HeightCm,
            CreatedAt = DateTime.UtcNow,
        };

        var hunter = new HunterProfile
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            HunterRank = "E",
            HunterSubRank = 3,
            HunterLevel = 1,
            CurrentXp = 0,
            HunterClass = "Balance Warrior",
        };

        // Streaks iniciais
        var streakTypes = new[] { "workout", "diet", "cardio", "water" };
        var streaks = streakTypes.Select(t => new Streak
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            StreakType = t,
            CurrentCount = 0,
            MaxCount = 0,
        }).ToList();

        // 17 ranks musculares iniciais
        var muscles = new[]
        {
            ("chest","Peito"), ("back_lat","Costas (Lat)"), ("back_mid","Costas (Mid)"),
            ("shoulders","Ombros"), ("biceps","Bíceps"), ("triceps","Tríceps"),
            ("forearms","Antebraços"), ("quads","Quadríceps"), ("hamstrings","Isquiotibiais"),
            ("glutes","Glúteos"), ("calves","Panturrilha"), ("abs","Abdômen"),
            ("obliques","Oblíquos"), ("traps","Trapézio"), ("neck","Pescoço"),
            ("hip_flexors","Flexores do Quadril"), ("cardio","Cardio (AGI)"),
        };

        var muscleRanks = muscles.Select(m => new MuscleRank
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            MuscleGroup = m.Item1,
            MuscleNamePt = m.Item2,
            MuscleRankValue = "Untrained",
            MuscleRankNumeric = 0,
        }).ToList();

        _db.Users.Add(user);
        _db.HunterProfiles.Add(hunter);
        _db.Streaks.AddRange(streaks);
        _db.MuscleRanks.AddRange(muscleRanks);

        await _db.SaveChangesAsync();

        var token = GenerateToken(user);
        return Ok(new
        {
            token,
            userId = user.Id,
            hunterLevel = hunter.HunterLevel,
        });
    }

    // ─── POST /api/auth/login ─────────────────────────────────────────────
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        var user = await _db.Users
            .FirstOrDefaultAsync(u => u.Email == dto.Email.ToLowerInvariant());

        if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            return Unauthorized(new { error = "E-mail ou senha incorretos." });

        var token = GenerateToken(user);
        return Ok(new { token, userId = user.Id });
    }

    // ─── GET /api/auth/me ─────────────────────────────────────────────────
    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> Me()
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var user = await _db.Users
            .Where(u => u.Id == userId)
            .Select(u => new { u.Id, u.Name, u.Email, u.HeightCm, u.CreatedAt })
            .FirstOrDefaultAsync();

        if (user == null) return NotFound();
        return Ok(user);
    }

    // ─── POST /api/auth/refresh ───────────────────────────────────────────
    [HttpPost("refresh")]
    [Authorize]
    public async Task<IActionResult> Refresh()
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var user = await _db.Users.FindAsync(userId);
        if (user == null) return NotFound();

        return Ok(new { token = GenerateToken(user) });
    }

    // ─── DELETE /api/auth/account ─────────────────────────────────────────
    [HttpDelete("account")]
    [Authorize]
    public async Task<IActionResult> DeleteAccount()
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var user = await _db.Users.FindAsync(userId);
        if (user == null) return NotFound();

        _db.Users.Remove(user);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ─── Helper JWT ───────────────────────────────────────────────────────
    private string GenerateToken(User user)
    {
        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new Claim(JwtRegisteredClaimNames.Iat,
                DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString()),
        };

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddDays(30),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
