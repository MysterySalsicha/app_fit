using FitnessTrack.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace FitnessTrack.API.Controllers;

[ApiController]
[Route("api/export")]
[Authorize]
public class ExportController : ControllerBase
{
    private readonly IExportService _exportService;

    public ExportController(IExportService exportService)
    {
        _exportService = exportService;
    }

    private Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    /// <summary>
    /// GET /api/export/all-data
    /// Returns a ZIP archive containing 8 CSV files with all user data.
    /// </summary>
    [HttpGet("all-data")]
    public async Task<IActionResult> ExportAllData()
    {
        var zipBytes = await _exportService.BuildZipExportAsync(UserId);

        var fileName = $"hunterfit-export-{DateTime.UtcNow:yyyy-MM-dd}.zip";
        return File(zipBytes, "application/zip", fileName);
    }
}
