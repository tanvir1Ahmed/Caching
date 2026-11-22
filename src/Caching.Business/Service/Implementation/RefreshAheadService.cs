using System.Collections.Concurrent;
using System.Diagnostics;
using Caching.Business.Constant;
using Caching.Business.Dto;
using Caching.Business.Mapper;
using Caching.Business.Service.Interface;
using Caching.Infrastructure.Repository.Interface;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection;

namespace Caching.Business.Service.Implementation;

public class RefreshAheadService(IServiceScopeFactory scopeFactory, IMemoryCache cache, ICacheEventLog log) : IRefreshAheadService
{
    private static readonly TimeSpan Duration = TimeSpan.FromSeconds(20);
    private static readonly TimeSpan RefreshAfter = TimeSpan.FromSeconds(15);
    private readonly ConcurrentDictionary<int, bool> refreshing = new();

    public async Task<CacheResultDto<ProductDto>> GetAsync(int id)
    {
        var stopwatch = Stopwatch.StartNew();
        var key = CacheKeys.Strategy(Strategy.RefreshAhead, id);

        if (cache.TryGetValue(key, out CachedValue<ProductDto>? cached) && cached is not null)
        {
            string? note = null;
            if (DateTime.UtcNow - cached.CachedAt >= RefreshAfter && refreshing.TryAdd(id, true))
            {
                note = "Entry is close to expiring, a background refresh was started";
                log.Add(key, "Hit", "Served from cache and started a background refresh");
                _ = RefreshAsync(id, key);
            }
            else
            {
                log.Add(key, "Hit", "Served from cache");
            }

            var hit = cached.Value.ToResult("Cache", key, stopwatch, note);
            hit.CachedAt = cached.CachedAt;
            hit.ExpiresAt = cached.ExpiresAt;
            return hit;
        }

        log.Add(key, "Miss", "Not cached, the user waits for the database");
        var value = await LoadAndStoreAsync(id, key);
        var result = value?.Value.ToResult("Database", key, stopwatch) ?? ((ProductDto?)null).ToResult("Database", key, stopwatch, "Product not found");
        result.CachedAt = value?.CachedAt;
        result.ExpiresAt = value?.ExpiresAt;
        return result;
    }

    private async Task RefreshAsync(int id, string key)
    {
        try
        {
            await LoadAndStoreAsync(id, key);
            log.Add(key, "Refreshed", "Background refresh finished, a fresh copy replaced the old one");
        }
        finally
        {
            refreshing.TryRemove(id, out _);
        }
    }

    private async Task<CachedValue<ProductDto>?> LoadAndStoreAsync(int id, string key)
    {
        using var scope = scopeFactory.CreateScope();
        var product = await scope.ServiceProvider.GetRequiredService<IProductRepository>().GetByIdAsync(id);
        if (product is null) return null;
        var value = new CachedValue<ProductDto>(product.ToDto(), Duration, null);
        cache.Set(key, value, Duration);
        return value;
    }
}
