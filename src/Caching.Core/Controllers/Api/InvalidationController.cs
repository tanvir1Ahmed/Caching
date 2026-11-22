using Caching.Business.Dto;
using Caching.Business.Service.Interface;
using Microsoft.AspNetCore.Mvc;

namespace Caching.Core.Controllers.Api;

[ApiController]
[Route("api/level6")]
public class InvalidationController(IInvalidationService invalidationService, IConsistencyService consistencyService) : ControllerBase
{
    private static readonly string[] Strategies = ["ttl", "delete", "version", "group"];
    private static readonly string[] RaceModes = ["naive", "version-check", "double-delete"];

    [HttpGet("{strategy}/products/{id:int}")]
    public async Task<IActionResult> Read(string strategy, int id) =>
        Strategies.Contains(strategy) ? Ok(await invalidationService.ReadAsync(strategy, id)) : BadRequest("Unknown strategy");

    [HttpPut("products/{id:int}/price")]
    public async Task<IActionResult> UpdatePrice(int id, PriceUpdateDto dto) => Ok(await invalidationService.UpdatePriceAsync(id, dto.Price));

    [HttpGet("state")]
    public IActionResult GetState() => Ok(invalidationService.GetState());

    [HttpDelete("cache")]
    public IActionResult Reset()
    {
        invalidationService.Reset();
        return NoContent();
    }

    [HttpPost("race/{mode}/products/{id:int}")]
    public async Task<IActionResult> RunRace(string mode, int id) =>
        RaceModes.Contains(mode) ? Ok(await consistencyService.RunRaceAsync(mode, id)) : BadRequest("Unknown mode");
}
