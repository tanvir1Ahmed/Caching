using Caching.Business.Service.Interface;
using Microsoft.AspNetCore.Mvc;

namespace Caching.Core.Controllers.Api;

[ApiController]
[Route("api/cache-events")]
public class CacheEventController(ICacheEventLog eventLog) : ControllerBase
{
    [HttpGet]
    public IActionResult GetAll(string? prefix) => Ok(eventLog.GetAll(prefix));

    [HttpDelete]
    public IActionResult Clear()
    {
        eventLog.Clear();
        return NoContent();
    }
}
