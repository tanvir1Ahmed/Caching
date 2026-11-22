using Caching.Business.Service.Interface;
using Microsoft.AspNetCore.Mvc;

namespace Caching.Core.Controllers.Api;

[ApiController]
[Route("api/level1/memory-cache")]
public class MemoryCacheController(IMemoryCacheBasicService memoryCacheService) : ControllerBase
{
    [HttpGet("products/{id:int}/no-cache")]
    public async Task<IActionResult> GetWithoutCache(int id) => Ok(await memoryCacheService.GetWithoutCacheAsync(id));

    [HttpGet("products/{id:int}/cached")]
    public async Task<IActionResult> GetWithCache(int id) => Ok(await memoryCacheService.GetWithCacheAsync(id));

    [HttpDelete("products/{id:int}")]
    public IActionResult Remove(int id)
    {
        memoryCacheService.Remove(id);
        return NoContent();
    }

    [HttpGet("stats")]
    public IActionResult GetStats() => Ok(memoryCacheService.GetStats());
}
