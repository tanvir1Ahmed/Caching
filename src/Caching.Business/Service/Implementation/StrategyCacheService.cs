using Caching.Business.Constant;
using Caching.Business.Service.Interface;
using Microsoft.Extensions.Caching.Memory;

namespace Caching.Business.Service.Implementation;

public class StrategyCacheService(IMemoryCache cache, ICacheEventLog log) : IStrategyCacheService
{
    public void Remove(string strategy, int id)
    {
        var key = CacheKeys.Strategy(strategy, id);
        cache.Remove(key);
        log.Add(key, "Remove", "Removed manually");
    }
}
