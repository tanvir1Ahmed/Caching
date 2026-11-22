using Caching.Business.Service.Interface;
using Microsoft.AspNetCore.Mvc;

namespace Caching.Core.Controllers.Api;

[ApiController]
[Route("api/level5")]
public class RedisFeaturesController(
    IRedisPlaygroundService playgroundService,
    ILeaderboardService leaderboardService,
    IRateLimiterService rateLimiterService,
    IPubSubService pubSubService,
    IDistributedLockService lockService,
    IRedisInfoService infoService) : ControllerBase
{
    [HttpPost("commands/{operation}")]
    public async Task<IActionResult> Execute(string operation, string? value) => Ok(await playgroundService.ExecuteAsync(operation, value));

    [HttpGet("keys")]
    public async Task<IActionResult> GetKeys(string pattern = "level5:*") => Ok(await playgroundService.GetKeysAsync(pattern));

    [HttpDelete("keys")]
    public async Task<IActionResult> DeleteKeys() => Ok(new { deleted = await playgroundService.DeleteKeysAsync("level5:*") });

    [HttpPost("leaderboard/{player}")]
    public async Task<IActionResult> AddScore(string player, double points) => Ok(await leaderboardService.AddScoreAsync(player, points));

    [HttpGet("leaderboard")]
    public async Task<IActionResult> GetLeaderboard(int count = 10) => Ok(await leaderboardService.GetTopAsync(count));

    [HttpGet("rate-limit/{client}")]
    public async Task<IActionResult> CheckRateLimit(string client)
    {
        var result = await rateLimiterService.CheckAsync(client);
        return result.Allowed ? Ok(result) : StatusCode(StatusCodes.Status429TooManyRequests, result);
    }

    [HttpPost("pubsub/publish")]
    public async Task<IActionResult> Publish(string message) =>
        Ok(new { receivers = await pubSubService.PublishAsync(message), subscribed = pubSubService.IsSubscribed });

    [HttpPost("locks/run")]
    public async Task<IActionResult> RunLockDemo(int workers = 4, int workMs = 2000, int lockMs = 5000, int startIntervalMs = 700) =>
        Ok(await lockService.RunWorkersAsync(Math.Clamp(workers, 1, 8), Math.Clamp(workMs, 100, 10000), Math.Clamp(lockMs, 100, 30000), Math.Clamp(startIntervalMs, 0, 5000)));

    [HttpGet("info")]
    public async Task<IActionResult> GetInfo() => Ok(await infoService.GetAsync());
}
