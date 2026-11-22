using System.Diagnostics;
using Caching.Business.Constant;
using Caching.Business.Dto;
using Caching.Business.Mapper;
using Caching.Business.Service.Interface;
using Caching.Infrastructure.Repository.Interface;
using Microsoft.Extensions.Caching.Memory;

namespace Caching.Business.Service.Implementation;

public class CacheAsideService(IProductRepository repository, IMemoryCache cache, ICacheEventLog log) : ICacheAsideService
{
    private static readonly TimeSpan Duration = TimeSpan.FromSeconds(20);

    public async Task<CacheResultDto<ProductDto>> GetAsync(int id)
    {
        var stopwatch = Stopwatch.StartNew();
        var key = CacheKeys.Strategy(Strategy.CacheAside, id);

        if (cache.TryGetValue(key, out CachedValue<ProductDto>? cached) && cached is not null)
        {
            log.Add(key, "Hit", "The service found it in the cache");
            var hit = cached.Value.ToResult("Cache", key, stopwatch);
            hit.CachedAt = cached.CachedAt;
            hit.ExpiresAt = cached.ExpiresAt;
            return hit;
        }

        log.Add(key, "Miss", "The service itself loads from the database and fills the cache");
        var product = await repository.GetByIdAsync(id);
        if (product is null) return ((ProductDto?)null).ToResult("Database", key, stopwatch, "Product not found");

        var value = new CachedValue<ProductDto>(product.ToDto(), Duration, null);
        cache.Set(key, value, Duration);
        var result = value.Value.ToResult("Database", key, stopwatch);
        result.CachedAt = value.CachedAt;
        result.ExpiresAt = value.ExpiresAt;
        return result;
    }
}
