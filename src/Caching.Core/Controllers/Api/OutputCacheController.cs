using Caching.Business.Service.Interface;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;

namespace Caching.Core.Controllers.Api;

[ApiController]
[Route("api/level2/output-cache")]
public class OutputCacheController(IHttpCacheService httpCacheService, IOutputCacheStore outputCacheStore, ICacheEventLog eventLog) : ControllerBase
{
    [HttpGet("products")]
    [OutputCache(PolicyName = "Products")]
    public async Task<IActionResult> Get(int id)
    {
        var result = await httpCacheService.GetProductAsync("output-cache", id);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpDelete("tags/{tag}")]
    public async Task<IActionResult> EvictByTag(string tag)
    {
        await outputCacheStore.EvictByTagAsync(tag, HttpContext.RequestAborted);
        eventLog.Add($"level2:output-cache:tag:{tag}", "Evicted", $"All responses tagged '{tag}' were removed");
        return NoContent();
    }
}
