using System.Diagnostics;
using Caching.Business.Constant;
using Caching.Business.Dto;
using Caching.Business.Mapper;
using Caching.Business.Service.Interface;
using Caching.Infrastructure.Repository.Interface;
using Microsoft.Extensions.Caching.Memory;

namespace Caching.Business.Service.Implementation;

public class MemoryCacheBasicService(IProductRepository repository, IMemoryCache cache, ICacheEventLog log) : IMemoryCacheBasicService
{
    private static readonly TimeSpan Duration = TimeSpan.FromSeconds(60);

    public async Task<CacheResultDto<ProductDto>> GetWithoutCacheAsync(int id)
    {
        var stopwatch = Stopwatch.StartNew();
        var product = await repository.GetByIdAsync(id);
        return new CacheResultDto<ProductDto>
        {
            Data = product?.ToDto(),
            Source = "Database",
            ElapsedMs = stopwatch.Elapsed.TotalMilliseconds
        };
    }

    public async Task<CacheResultDto<ProductDto>> GetWithCacheAsync(int id)
    {
        var stopwatch = Stopwatch.StartNew();
        var key = CacheKeys.Product(id);

        if (cache.TryGetValue(key, out CachedValue<ProductDto>? cached) && cached is not null)
        {
            log.Add(key, "Hit", "Found in memory, database not touched");
            return new CacheResultDto<ProductDto>
            {
                Data = cached.Value,
                Source = "Cache",
                Key = key,
                ElapsedMs = stopwatch.Elapsed.TotalMilliseconds,
                CachedAt = cached.CachedAt,
                ExpiresAt = cached.ExpiresAt
            };
        }

        log.Add(key, "Miss", "Not in memory, loading from database");
        var product = await repository.GetByIdAsync(id);
        if (product is null)
        {
            return new CacheResultDto<ProductDto>
            {
                Source = "Database",
                Key = key,
                ElapsedMs = stopwatch.Elapsed.TotalMilliseconds,
                Note = "Product not found, nothing was cached"
            };
        }

        var value = new CachedValue<ProductDto>(product.ToDto(), Duration, null);
        cache.Set(key, value, Duration);
        log.Add(key, "Set", $"Stored in memory for {Duration.TotalSeconds} seconds");

        return new CacheResultDto<ProductDto>
        {
            Data = value.Value,
            Source = "Database",
            Key = key,
            ElapsedMs = stopwatch.Elapsed.TotalMilliseconds,
            CachedAt = value.CachedAt,
            ExpiresAt = value.ExpiresAt
        };
    }

    public void Remove(int id)
    {
        var key = CacheKeys.Product(id);
        cache.Remove(key);
        log.Add(key, "Remove", "Removed manually");
    }

    public CacheStatsDto GetStats()
    {
        var statistics = cache.GetCurrentStatistics();
        if (statistics is null) return new CacheStatsDto();
        var total = statistics.TotalHits + statistics.TotalMisses;
        return new CacheStatsDto
        {
            Hits = statistics.TotalHits,
            Misses = statistics.TotalMisses,
            HitRatio = total == 0 ? 0 : Math.Round((double)statistics.TotalHits / total * 100, 2),
            EntryCount = statistics.CurrentEntryCount,
            EstimatedSize = statistics.CurrentEstimatedSize
        };
    }
}
