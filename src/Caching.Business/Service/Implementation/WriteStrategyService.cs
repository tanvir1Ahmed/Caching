using System.Diagnostics;
using Caching.Business.Constant;
using Caching.Business.Dto;
using Caching.Business.Mapper;
using Caching.Business.Service.Interface;
using Caching.Infrastructure.Repository.Interface;
using Microsoft.Extensions.Caching.Memory;

namespace Caching.Business.Service.Implementation;

public class WriteStrategyService(IProductRepository repository, IMemoryCache cache, ICacheEventLog log) : IWriteStrategyService
{
    private static readonly TimeSpan Duration = TimeSpan.FromMinutes(5);

    public async Task<CacheResultDto<ProductDto>> GetAsync(string strategy, int id)
    {
        var stopwatch = Stopwatch.StartNew();
        var key = CacheKeys.Strategy(strategy, id);

        if (cache.TryGetValue(key, out ProductDto? cached) && cached is not null)
        {
            log.Add(key, "Hit", "Read from cache");
            return cached.ToResult("Cache", key, stopwatch);
        }

        log.Add(key, "Miss", "Not cached, reading the database");
        var product = (await repository.GetByIdAsync(id))?.ToDto();
        if (product is not null) cache.Set(key, product, Duration);
        return product.ToResult("Database", key, stopwatch);
    }

    public async Task<CacheResultDto<ProductDto>> WriteThroughAsync(int id, decimal price)
    {
        var stopwatch = Stopwatch.StartNew();
        var key = CacheKeys.Strategy(Strategy.WriteThrough, id);

        var product = (await repository.UpdatePriceAsync(id, price))?.ToDto();
        if (product is null) return product.ToResult("Database", key, stopwatch, "Product not found");
        log.Add(key, "DbWrite", $"Database updated to ${price}");

        cache.Set(key, product, Duration);
        log.Add(key, "Set", "Cache updated in the same operation, so it is never stale");
        return product.ToResult("Database + Cache", key, stopwatch);
    }

    public async Task<CacheResultDto<ProductDto>> WriteAroundAsync(int id, decimal price)
    {
        var stopwatch = Stopwatch.StartNew();
        var key = CacheKeys.Strategy(Strategy.WriteAround, id);

        var product = (await repository.UpdatePriceAsync(id, price))?.ToDto();
        if (product is null) return product.ToResult("Database", key, stopwatch, "Product not found");
        log.Add(key, "DbWrite", $"Database updated to ${price}");

        cache.Remove(key);
        log.Add(key, "Remove", "Cache entry removed, the next read will load the new value");
        return product.ToResult("Database", key, stopwatch);
    }
}
