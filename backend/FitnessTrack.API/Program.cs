using FitnessTrack.Application.Services;
using FitnessTrack.Application.Jobs;
using FitnessTrack.Infrastructure.Data;
using FitnessTrack.API.Middleware;
using FitnessTrack.API.Services;
using Hangfire;
using Hangfire.PostgreSql;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.OpenApi.Models;
using Serilog;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// ─── Serilog ───────────────────────────────────────────────────────────────
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .CreateLogger();

builder.Host.UseSerilog();

// ─── Database ──────────────────────────────────────────────────────────────
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"),
        o => o.EnableRetryOnFailure(3)));

// ─── Auth JWT ──────────────────────────────────────────────────────────────
var jwtKey = builder.Configuration["Jwt:Key"]
    ?? throw new InvalidOperationException("JWT Key not configured");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ClockSkew = TimeSpan.Zero,
        };

        // Verifica blacklist de tokens (revogação pós-logout)
        options.Events = new JwtBearerEvents
        {
            OnTokenValidated = ctx =>
            {
                var blacklist = ctx.HttpContext.RequestServices
                    .GetRequiredService<ITokenBlacklistService>();

                var jti = ctx.Principal?.FindFirst(JwtRegisteredClaimNames.Jti)?.Value;
                if (!string.IsNullOrEmpty(jti) && blacklist.IsRevoked(jti))
                {
                    ctx.Fail("Token revogado.");
                }
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization();

// ─── CORS (permitir frontend Next.js) ──────────────────────────────────────
builder.Services.AddCors(options =>
{
    options.AddPolicy("HunterFitPolicy", policy =>
    {
        var origins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
            ?? new[] { "http://localhost:3000" };

        policy.WithOrigins(origins)
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// ─── Token Blacklist (singleton — persiste durante a vida da aplicação) ────
builder.Services.AddSingleton<ITokenBlacklistService, TokenBlacklistService>();

// ─── Application Services ──────────────────────────────────────────────────
builder.Services.AddScoped<IWorkoutParserService, WorkoutParserService>();
builder.Services.AddScoped<IDietParserService, DietParserService>();
builder.Services.AddScoped<IStreakService, StreakService>();
builder.Services.AddScoped<IXpCalculatorService, XpCalculatorService>();
builder.Services.AddScoped<IMuscleRankService, MuscleRankService>();
builder.Services.AddScoped<IQuestService, QuestService>();
builder.Services.AddScoped<IPenaltyService, PenaltyService>();
builder.Services.AddScoped<IHunterProgressService, HunterProgressService>();
builder.Services.AddScoped<ISkillDetectionService, SkillDetectionService>();
builder.Services.AddScoped<IBodyAlertService, BodyAlertService>();
builder.Services.AddScoped<IExportService, ExportService>();
builder.Services.AddScoped<IAiVisionService, AiVisionService>();
builder.Services.AddScoped<IStravaService, StravaService>();
builder.Services.AddHttpClient("vapid");
builder.Services.AddScoped<IPushNotificationService, PushNotificationService>();

// ─── Hangfire ──────────────────────────────────────────────────────────────
var connStr = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddHangfire(c => c
    .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
    .UseSimpleAssemblyNameTypeSerializer()
    .UseRecommendedSerializerSettings()
    .UsePostgreSqlStorage(connStr));
builder.Services.AddHangfireServer();

// Transient para os jobs (cada execução cria nova instância)
builder.Services.AddTransient<DailyQuestGeneratorJob>();
builder.Services.AddTransient<StreakUpdateJob>();
builder.Services.AddTransient<WaterReminderJob>();
builder.Services.AddTransient<PenaltyCheckJob>();
builder.Services.AddTransient<StravaSyncJob>();
builder.Services.AddHttpClient("strava");

// ─── Controllers + Swagger ─────────────────────────────────────────────────
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "HunterFit API",
        Version = "v1",
        Description = "Arise. Level Up. IRL.",
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header. Format: 'Bearer {token}'",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer",
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

// ─── Build ─────────────────────────────────────────────────────────────────
var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "HunterFit API v1"));
}

app.UseSerilogRequestLogging();
app.UseHttpsRedirection();
app.UseCors("HunterFitPolicy");

// ─── Security Headers ─────────────────────────────────────────────────────
app.UseMiddleware<SecurityHeadersMiddleware>();

// ─── Rate Limiting (custom, .NET 6 compatible) ────────────────────────────
app.UseMiddleware<RateLimitMiddleware>();

app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// ─── Hangfire Dashboard (protegido por auth em produção) ──────────────────
app.UseHangfireDashboard("/hangfire", new DashboardOptions
{
    IsReadOnlyFunc = _ => !app.Environment.IsDevelopment(),
});

// ─── Recurring Jobs ────────────────────────────────────────────────────────
RecurringJob.AddOrUpdate<DailyQuestGeneratorJob>(
    "daily-quest-generator",
    j => j.ExecuteAsync(),
    "0 0 * * *");   // 00:00 UTC diário

RecurringJob.AddOrUpdate<StreakUpdateJob>(
    "streak-updater",
    j => j.ExecuteAsync(),
    "0 6 * * *");   // 06:00 UTC diário

RecurringJob.AddOrUpdate<WaterReminderJob>(
    "water-reminder",
    j => j.ExecuteAsync(),
    "0 */2 8-22 * *"); // a cada 2h entre 8h-22h UTC

RecurringJob.AddOrUpdate<PenaltyCheckJob>(
    "penalty-check",
    j => j.ExecuteAsync(),
    "0 9 * * *");   // 09:00 UTC diário

RecurringJob.AddOrUpdate<StravaSyncJob>(
    "strava-sync",
    j => j.ExecuteAsync(),
    "*/30 * * * *");  // a cada 30 minutos

// ─── Migrations automáticas em dev ────────────────────────────────────────
if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
}

app.Run();
