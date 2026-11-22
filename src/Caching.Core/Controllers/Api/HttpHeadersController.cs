using Caching.Business.Constant;
using Caching.Business.Service.Interface;
using Microsoft.AspNetCore.Mvc;

namespace Caching.Core.Controllers.Api;

[ApiController]
[Route("api/level2/headers")]
public class HttpHeadersController(IHttpCacheService httpCacheService, ICacheEventLog eventLog) : ControllerBase
{
    [HttpGet("{mode}/products/{id:int}")]
    public async Task<IActionResult> Get(HeaderMode mode, int id)
    {
        var scope = $"headers:{mode}";
        var result = await httpCacheService.GetProductAsync(scope, id);
        if (result is null) return NotFound();

        Response.Headers.CacheControl = mode switch
        {
            HeaderMode.NoCache => "no-cache",
            HeaderMode.MaxAge => "private, max-age=15",
            HeaderMode.StaleWhileRevalidate => "private, max-age=10, stale-while-revalidate=30",
            _ => "no-store"
        };
        Response.Headers.ETag = result.ETag;

        if (mode != HeaderMode.NoStore && Request.Headers.IfNoneMatch.ToString() == result.ETag)
        {
            eventLog.Add(CacheKeys.Http(scope, id), "NotModified", "ETag matched, sent 304 without a body");
            return StatusCode(StatusCodes.Status304NotModified);
        }

        return Ok(result);
    }
}
