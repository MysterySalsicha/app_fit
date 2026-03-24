using FitnessTrack.Core.Entities;
using FitnessTrack.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace FitnessTrack.Application.Services;

public interface IStreakService
{
    Task UpdateWorkoutStreakAsync(Guid userId, DateOnly date);
    Task UpdateDietStreakAsync(Guid userId, DateOnly date);
    Task UpdateCardioStreakAsync(Guid userId, DateOnly date);
    Task UpdateWaterStreakAsync(Guid userId, DateOnly date);
}

public class StreakService : IStreakService
{
    private readonly AppDbContext _db;

    public StreakService(AppDbContext db)
    {
        _db = db;
    }

    public Task UpdateWorkoutStreakAsync(Guid userId, DateOnly date) =>
        UpdateStreak(userId, "workout", date);

    public Task UpdateDietStreakAsync(Guid userId, DateOnly date) =>
        UpdateStreak(userId, "diet", date);

    public Task UpdateCardioStreakAsync(Guid userId, DateOnly date) =>
        UpdateStreak(userId, "cardio", date);

    public Task UpdateWaterStreakAsync(Guid userId, DateOnly date) =>
        UpdateStreak(userId, "water", date);

    private async Task UpdateStreak(Guid userId, string streakType, DateOnly date)
    {
        var streak = await _db.Streaks
            .FirstOrDefaultAsync(s => s.UserId == userId && s.StreakType == streakType);

        if (streak == null)
        {
            streak = new Streak
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                StreakType = streakType,
                CurrentCount = 1,
                MaxCount = 1,
                LastValidDate = date,
                UpdatedAt = DateTime.UtcNow,
            };
            _db.Streaks.Add(streak);
        }
        else
        {
            // Verifica continuidade
            if (streak.LastValidDate.HasValue)
            {
                var daysSince = date.DayNumber - streak.LastValidDate.Value.DayNumber;

                if (daysSince == 1)
                {
                    // Dia consecutivo — incrementa
                    streak.CurrentCount++;
                }
                else if (daysSince == 0)
                {
                    // Mesmo dia — ignora (já registrado)
                    return;
                }
                else
                {
                    // Streak quebrado
                    streak.CurrentCount = 1;
                }
            }
            else
            {
                streak.CurrentCount = 1;
            }

            streak.LastValidDate = date;
            streak.MaxCount = Math.Max(streak.MaxCount, streak.CurrentCount);
            streak.UpdatedAt = DateTime.UtcNow;

            // Atualiza Shadow Army
            await UpdateShadowArmyAsync(userId, streakType, streak.CurrentCount);
        }

        await _db.SaveChangesAsync();
    }

    private async Task UpdateShadowArmyAsync(Guid userId, string streakType, int streakCount)
    {
        var hunter = await _db.HunterProfiles.FirstOrDefaultAsync(h => h.UserId == userId);
        if (hunter == null) return;

        // Fórmula do Shadow Army level: streakCount / 7 (arredondado para baixo)
        int shadowLevel = streakCount / 7;

        switch (streakType)
        {
            case "workout": hunter.ShadowIgrisLevel = shadowLevel; break;
            case "cardio":  hunter.ShadowFangLevel  = shadowLevel; break;
            case "diet":    hunter.ShadowIronLevel  = shadowLevel; break;
            // "volume" é calculado separado (não é um streak simples)
        }

        hunter.UpdatedAt = DateTime.UtcNow;
    }
}
