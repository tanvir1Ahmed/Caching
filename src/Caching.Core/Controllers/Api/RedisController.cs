using Caching.Business.Service.Interface;
using Microsoft.AspNetCore.Mvc;

namespace Caching.Core.Controllers.Api;

[ApiController]
[Route("api/redis")]
public class RedisController(IRedisStatusService redisStatusService) : ControllerBase
{
    [HttpGet("status")]
    public async Task<IActionResult> GetStatus() => Ok(await redisStatusService.GetAsync());
}
