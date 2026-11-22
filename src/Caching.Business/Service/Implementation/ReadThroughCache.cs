using System.Diagnostics;
using Caching.Business.Dto;
using Caching.Business.Mapper;
using Caching.Business.Service.Interface;
using Microsoft.Extensions.Caching.Memory;

namespace Caching.Business.Service.Implementation;

public class ReadThroughCache<TValue>(
    IMemoryCache cache,
    ICacheEventLog log,
    string keyPrefix,
    TimeSpan duration,
    Func<int, Task<TValue?>> loader) : IReadThroughCache<TValue>
{
    public async Task<CacheResultDto<TValue>> GetAsync(int id)
    {
        var stopwatch = Stopwatch.StartNew();
        var key = $"{keyPrefix}:{id}";
        var loaded = false;

        var value = await cache.GetOrCreateAsync(key, async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = duration;
            loaded = true;
            log.Add(key, "Miss", "The cache called its own loader to read the database");
            return await loader(id);
        });

        if (!loaded) log.Add(key, "Hit", "The cache answered, the caller never knew about the database");
        return value.ToResult(loaded ? "Database" : "Cache", key, stopwatch, value is null ? "Not found. Note: null was cached too." : null);
    }
}
