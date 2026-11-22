using System.Diagnostics;
using Caching.Business.Constant;
using Caching.Business.Dto;
using Caching.Business.Mapper;
using Caching.Business.Service.Interface;
using Caching.Infrastructure.Repository.Interface;
using Microsoft.Extensions.Caching.Memory;

namespace Caching.Business.Service.Implementation;

public class ExpirationService(IProductRepository repository, IMemoryCache cache, ICacheEventLog log) : IExpirationService
{
    private static readonly Dictionary<ExpirationType, (TimeSpan? Absolute, TimeSpan? Sliding)> Settings = new()
    {
        [ExpirationType.Absolute] = (TimeSpan.FromSeconds(20), null),
        [ExpirationType.Sliding] = (null, TimeSpan.FromSeconds(8)),
        [ExpirationType.Combined] = (TimeSpan.FromSeconds(30), TimeSpan.FromSeconds(8))
    };

    public async Task<CacheResultDto<ProductDto>> GetAsync(ExpirationType type, int id)
    {
        var stopwatch = Stopwatch.StartNew();
        var key = CacheKeys.Expiration(type, id);

        if (cache.TryGetValue(key, out CachedValue<ProductDto>? cached) && cached is not null)
        {
            cached.LastAccessedAt = DateTime.UtcNow;
            log.Add(key, "Hit", $"Found in memory, expires at {cached.ExpiresAt:HH:mm:ss}");
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

        var (absolute, sliding) = Settings[type];
        var value = new CachedValue<ProductDto>(product.ToDto(), absolute, sliding);
        var options = new MemoryCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = absolute,
            SlidingExpiration = sliding
        };
        options.RegisterPostEvictionCallback((evictedKey, _, reason, _) =>
            log.Add(evictedKey.ToString()!, "Evicted", $"Reason: {reason}"));

        cache.Set(key, value, options);
        log.Add(key, "Set", $"Stored, expires at {value.ExpiresAt:HH:mm:ss}");

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

    public void Remove(ExpirationType type, int id) => cache.Remove(CacheKeys.Expiration(type, id));

    public IEnumerable<ExpirationSettingDto> GetSettings() =>
        Settings.Select(s => new ExpirationSettingDto
        {
            Type = s.Key.ToString(),
            AbsoluteSeconds = (int?)s.Value.Absolute?.TotalSeconds,
            SlidingSeconds = (int?)s.Value.Sliding?.TotalSeconds
        });
}
