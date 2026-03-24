using FitnessTrack.Core.Entities;
using FitnessTrack.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace FitnessTrack.Application.Services;

public interface IBodyAlertService
{
    Task<List<BodyAlert>> AnalyzeAsync(Guid userId, BodyMeasurement latest);
}

public record BodyAlert(string Type, string Severity, string Message);

public class BodyAlertService : IBodyAlertService
{
    private readonly AppDbContext _db;

    public BodyAlertService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<List<BodyAlert>> AnalyzeAsync(Guid userId, BodyMeasurement latest)
    {
        var alerts = new List<BodyAlert>();

        // Busca a medição anterior para comparar
        var prev = await _db.BodyMeasurements
            .Where(b => b.UserId == userId && b.Id != latest.Id)
            .OrderByDescending(b => b.MeasuredAt)
            .FirstOrDefaultAsync();

        if (prev is null) return alerts; // primeira medição, sem alertas

        var daysBetween = (latest.MeasuredAt - prev.MeasuredAt).TotalDays;
        if (daysBetween < 1) return alerts;

        // ── Alerta 1: perda rápida de massa muscular ─────────────────────
        if (latest.MuscleMassKg.HasValue && prev.MuscleMassKg.HasValue)
        {
            var muscleDelta = (double)(latest.MuscleMassKg.Value - prev.MuscleMassKg.Value);
            var musclePerWeek = muscleDelta / daysBetween * 7;

            if (musclePerWeek < -0.5)
            {
                alerts.Add(new BodyAlert(
                    "muscle_loss",
                    "warning",
                    $"Perda de {Math.Abs(muscleDelta):F1}kg de massa muscular em {daysBetween:F0} dias. " +
                    "Revise a ingestão proteica e o déficit calórico."
                ));
            }
        }

        // ── Alerta 2: retenção de água (% água acima do normal) ──────────
        if (latest.WaterPct.HasValue)
        {
            var waterPct = (double)latest.WaterPct.Value;
            if (waterPct > 65)
            {
                alerts.Add(new BodyAlert(
                    "water_retention",
                    "info",
                    $"% de água corporal elevada ({waterPct:F1}%). Pode indicar retenção hídrica — " +
                    "verifique consumo de sódio e hidratação."
                ));
            }
        }

        // ── Alerta 3: gordura visceral alta ──────────────────────────────
        if (latest.VisceralFatLevel.HasValue && latest.VisceralFatLevel.Value >= 10)
        {
            var level = (double)latest.VisceralFatLevel.Value;
            var severity = level >= 15 ? "danger" : "warning";
            alerts.Add(new BodyAlert(
                "visceral_fat",
                severity,
                $"Gordura visceral nível {level:F0} — risco à saúde metabólica. " +
                "Priorize cardio e deficit calórico moderado."
            ));
        }

        // ── Alerta 4: ganho de peso muito rápido (>1kg/semana) ───────────
        if (latest.WeightKg.HasValue && prev.WeightKg.HasValue)
        {
            var weightDelta = (double)(latest.WeightKg.Value - prev.WeightKg.Value);
            var weightPerWeek = weightDelta / daysBetween * 7;

            if (weightPerWeek > 1.0)
            {
                alerts.Add(new BodyAlert(
                    "fast_weight_gain",
                    "warning",
                    $"+{weightDelta:F1}kg em {daysBetween:F0} dias ({weightPerWeek:F1}kg/semana). " +
                    "Verifique se o excedente está vindo de massa magra ou gordura."
                ));
            }
            else if (weightPerWeek < -1.5)
            {
                alerts.Add(new BodyAlert(
                    "fast_weight_loss",
                    "warning",
                    $"{weightDelta:F1}kg em {daysBetween:F0} dias. " +
                    "Perda muito rápida — risco de catabolismo muscular."
                ));
            }
        }

        // ── Alerta 5: IMC fora da faixa saudável ────────────────────────
        if (latest.Bmi.HasValue)
        {
            var bmi = (double)latest.Bmi.Value;
            if (bmi < 18.5)
                alerts.Add(new BodyAlert("bmi_low",    "warning", $"IMC {bmi:F1} — abaixo do peso. Foco em ganho de massa magra."));
            else if (bmi >= 30)
                alerts.Add(new BodyAlert("bmi_obese",  "warning", $"IMC {bmi:F1} — obesidade. Deficit calórico progressivo recomendado."));
        }

        return alerts;
    }
}
