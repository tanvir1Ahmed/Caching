using Caching.Business.Service.Interface;
using Microsoft.AspNetCore.Mvc;

namespace Caching.Core.Controllers.Api;

[ApiController]
[Route("api/level2/response-cache")]
public class ResponseCacheController(IHttpCacheService httpCacheService) : ControllerBase
{
    [HttpGet("products")]
    [ResponseCache(Duration = 20, Location = ResponseCacheLocation.Any, VaryByQueryKeys = ["id"])]
    public async Task<IActionResult> Get(int id)
    {
        var result = await httpCacheService.GetProductAsync("response-cache", id);
        return result is null ? NotFound() : Ok(result);
    }
}
