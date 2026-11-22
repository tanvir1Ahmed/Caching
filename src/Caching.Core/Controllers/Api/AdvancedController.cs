using Caching.Business.Dto;
using Caching.Business.Service.Interface;
using Microsoft.AspNetCore.Mvc;

namespace Caching.Core.Controllers.Api;

[ApiController]
[Route("api/level7")]
public class AdvancedController(
    IStampedeService stampedeService,
    IPenetrationService penetrationService,
    IAvalancheService avalancheService,
    IMultiLevelCacheService multiLevelCacheService,
    IMetricsService metricsService) : ControllerBase
{
    private static readonly string[] StampedeModes = ["none", "lock", "hybrid"];
    private static readonly string[] PenetrationModes = ["none", "null-cache", "bloom"];
    private static readonly string[] Patterns = ["repeated", "random", "valid"];

    [HttpPost("stampede/{mode}/products/{id:int}")]
    public async Task<IActionResult> RunStampede(string mode, int id, int requests = 20) =>
        StampedeModes.Contains(mode)
            ? Ok(await stampedeService.RunAsync(mode, id, Math.Clamp(requests, 1, 100)))
            : BadRequest("Unknown mode");

    [HttpPost("penetration/{mode}")]
    public async Task<IActionResult> RunPenetration(string mode, string pattern = "repeated", int requests = 10) =>
        PenetrationModes.Contains(mode) && Patterns.Contains(pattern)
            ? Ok(await penetrationService.RunAsync(mode, pattern, Math.Clamp(requests, 1, 20)))
            : BadRequest("Unknown mode or pattern");

    [HttpGet("penetration/bloom")]
    public async Task<IActionResult> GetBloom(string? check) => Ok(await penetrationService.GetBloomStateAsync(check));

    [HttpPost("avalanche/warm")]
    public IActionResult WarmAvalanche() => Ok(avalancheService.Warm());

    [HttpGet("avalanche/alive")]
    public IActionResult CountAlive() => Ok(avalancheService.CountAlive());

    [HttpGet("multi-level/products/{id:int}")]
    public async Task<IActionResult> GetMultiLevel(int id) => Ok(await multiLevelCacheService.GetAsync(id));

    [HttpPut("multi-level/products/{id:int}/price")]
    public async Task<IActionResult> UpdateMultiLevel(int id, PriceUpdateDto dto) => Ok(await multiLevelCacheService.UpdatePriceAsync(id, dto.Price));

    [HttpPost("multi-level/products/{id:int}/hammer")]
    public async Task<IActionResult> Hammer(int id, int requests = 1000) => Ok(await multiLevelCacheService.HammerAsync(id, Math.Clamp(requests, 1, 10000)));

    [HttpDelete("multi-level/local")]
    public IActionResult ClearLocal()
    {
        multiLevelCacheService.ClearLocal();
        return NoContent();
    }

    [HttpGet("metrics")]
    public async Task<IActionResult> GetMetrics() => Ok(await metricsService.GetAsync());
}
