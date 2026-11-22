using Caching.Business.Constant;
using Caching.Business.Dto;
using Caching.Business.Service.Interface;
using Caching.Infrastructure.Repository.Interface;

namespace Caching.Business.Service.Implementation;

public class RateLimiterService(IRedisRepository redis, ICacheEventLog log) : IRateLimiterService
{
    private const int Limit = 5;
    private const int WindowSeconds = 10;

    public async Task<RateLimitResultDto> CheckAsync(string client)
    {
        var window = DateTimeOffset.UtcNow.ToUnixTimeSeconds() / WindowSeconds;
        var key = CacheKeys.Redis($"rate:{client}:{window}");

        var count = await redis.IncrementAsync(key, TimeSpan.FromSeconds(WindowSeconds));
        var ttl = await redis.TimeToLiveAsync(key);
        var allowed = count <= Limit;
        log.Add(key, allowed ? "Allowed" : "Blocked", $"Request {count} of {Limit} in this {WindowSeconds}-second window");

        return new RateLimitResultDto
        {
            Allowed = allowed,
            Count = count,
            Limit = Limit,
            WindowSeconds = WindowSeconds,
            ResetsInSeconds = ttl?.TotalSeconds,
            Key = key
        };
    }
}
