using Caching.Business.Constant;
using Caching.Business.Service.Interface;
using Microsoft.AspNetCore.Mvc;

namespace Caching.Core.Controllers.Api;

[ApiController]
[Route("api/level2/validation")]
public class ValidationController(IHttpCacheService httpCacheService, ICacheEventLog eventLog) : ControllerBase
{
    private const string Scope = "validation";

    [HttpGet("products/{id:int}")]
    public async Task<IActionResult> Get(int id)
    {
        var result = await httpCacheService.GetProductAsync(Scope, id);
        if (result is null) return NotFound();

        Response.Headers.CacheControl = "no-cache";
        Response.Headers.ETag = result.ETag;
        Response.Headers.LastModified = result.LastModified.ToString("R");

        var ifNoneMatch = Request.Headers.IfNoneMatch.ToString();
        if (!string.IsNullOrEmpty(ifNoneMatch))
        {
            if (ifNoneMatch != result.ETag) return Ok(result);
            eventLog.Add(CacheKeys.Http(Scope, id), "NotModified", "If-None-Match matched the ETag, sent 304");
            return StatusCode(StatusCodes.Status304NotModified);
        }

        if (DateTimeOffset.TryParse(Request.Headers.IfModifiedSince.ToString(), out var since) && result.LastModified <= since)
        {
            eventLog.Add(CacheKeys.Http(Scope, id), "NotModified", "Not changed since If-Modified-Since, sent 304");
            return StatusCode(StatusCodes.Status304NotModified);
        }

        return Ok(result);
    }
}
