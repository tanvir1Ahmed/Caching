using Caching.Business.Dto;
using Caching.Business.Service.Interface;
using Caching.Infrastructure.Exceptions;
using Caching.Infrastructure.Repository.Interface;
using Microsoft.Extensions.Caching.Distributed;

namespace Caching.Business.Service.Implementation;

public class RedisStatusService(IRedisRepository redis, IDistributedCache distributedCache) : IRedisStatusService
{
    public async Task<RedisStatusDto> GetAsync()
    {
        var status = new RedisStatusDto
        {
            Configured = redis.IsConfigured,
            DistributedCacheProvider = distributedCache.GetType().Name
        };
        if (!redis.IsConfigured) return status;

        try
        {
            status.PingMs = Math.Round(await redis.PingAsync(), 2);
            var info = await redis.InfoAsync();
            status.ServerVersion = info.GetValueOrDefault("Server.redis_version");
            status.UsedMemory = info.GetValueOrDefault("Memory.used_memory_human");
            status.Connected = true;
        }
        catch (CacheUnavailableException ex)
        {
            status.Error = ex.Message;
        }

        return status;
    }
}
