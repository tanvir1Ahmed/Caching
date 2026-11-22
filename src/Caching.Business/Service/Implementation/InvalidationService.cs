using System.Collections.Concurrent;
using System.Diagnostics;
using Caching.Business.Constant;
using Caching.Business.Dto;
using Caching.Business.Mapper;
using Caching.Business.Service.Interface;
using Caching.Infrastructure.Repository.Interface;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Primitives;

namespace Caching.Business.Service.Implementation;

public class InvalidationService(IServiceScopeFactory scopeFactory, ICacheEventLog log) : IInvalidationService, IDisposable
{
    public const string Ttl = "ttl";
    public const string Delete = "delete";
    public const string Version = "version";
    public const string Group = "group";

    private static readonly TimeSpan Duration = TimeSpan.FromSeconds(60);

    private MemoryCache cache = new(new MemoryCacheOptions());
    private readonly ConcurrentDictionary<int, int> versions = new();
    private CancellationTokenSource groupToken = new();
    private int groupGeneration = 1;

    public async Task<CacheResultDto<ProductDto>> ReadAsync(string strategy, int id)
    {
        var stopwatch = Stopwatch.StartNew();
        var key = strategy == Version
            ? CacheKeys.VersionedProduct(id, versions.GetOrAdd(id, 1))
            : CacheKeys.Invalidation(strategy, id);

        if (cache.TryGetValue(key, out ProductDto? cached) && cached is not null)
        {
            log.Add(key, "Hit", "Served from cache");
            return cached.ToResult("Cache", key, stopwatch);
        }

        var product = await LoadAsync(id);
        if (product is null) return product.ToResult("Database", key, stopwatch, "Product not found");

        var options = new MemoryCacheEntryOptions { AbsoluteExpirationRelativeToNow = Duration };
        if (strategy == Group) options.AddExpirationToken(new CancellationChangeToken(groupToken.Token));
        cache.Set(key, product, options);
        log.Add(key, "Miss", strategy == Group ? $"Loaded and stored in group generation {groupGeneration}" : "Loaded and stored");
        return product.ToResult("Database", key, stopwatch);
    }

    public async Task<CacheResultDto<ProductDto>> UpdatePriceAsync(int id, decimal price)
    {
        var stopwatch = Stopwatch.StartNew();
        using var scope = scopeFactory.CreateScope();
        var product = (await scope.ServiceProvider.GetRequiredService<IProductRepository>().UpdatePriceAsync(id, price))?.ToDto();
        log.Add(CacheKeys.Invalidation("write", id), "DbWrite", $"Database updated to ${price}");

        log.Add(CacheKeys.Invalidation(Ttl, id), "Stale", "TTL only: nothing is done, the old value stays until it expires");

        cache.Remove(CacheKeys.Invalidation(Delete, id));
        log.Add(CacheKeys.Invalidation(Delete, id), "Remove", "Delete on write: the key was removed");

        var oldVersion = versions.GetOrAdd(id, 1);
        var newVersion = versions.AddOrUpdate(id, 2, (_, v) => v + 1);
        log.Add(CacheKeys.VersionedProduct(id, newVersion), "Set", $"Versioned key: version {oldVersion} -> {newVersion}. Readers now use a new key; the old one just expires.");

        var oldToken = groupToken;
        groupToken = new CancellationTokenSource();
        groupGeneration++;
        await oldToken.CancelAsync();
        oldToken.Dispose();
        log.Add(CacheKeys.Invalidation(Group, id), "Remove", $"Group token cancelled: every product in the group was invalidated (generation {groupGeneration})");

        return product.ToResult("Database", CacheKeys.Invalidation("write", id), stopwatch);
    }

    public void Reset()
    {
        var old = cache;
        cache = new MemoryCache(new MemoryCacheOptions());
        old.Dispose();
        versions.Clear();
    }

    public InvalidationStateDto GetState() => new()
    {
        Versions = new Dictionary<int, int>(versions),
        GroupGeneration = groupGeneration
    };

    public void Dispose()
    {
        cache.Dispose();
        groupToken.Dispose();
    }

    private async Task<ProductDto?> LoadAsync(int id)
    {
        using var scope = scopeFactory.CreateScope();
        return (await scope.ServiceProvider.GetRequiredService<IProductRepository>().GetByIdAsync(id))?.ToDto();
    }
}
