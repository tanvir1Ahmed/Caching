using System.Diagnostics;
using System.Text.Json;
using Caching.Business.Constant;
using Caching.Business.Dto;
using Caching.Business.Mapper;
using Caching.Business.Service.Interface;
using Caching.Infrastructure.Repository.Interface;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection;

namespace Caching.Business.Service.Implementation;

public class TwoServerService(IServiceScopeFactory scopeFactory, IDistributedCache distributedCache, ICacheEventLog log) : ITwoServerService, IDisposable
{
    private static readonly TimeSpan Duration = TimeSpan.FromMinutes(5);

    private readonly Dictionary<string, MemoryCache> serverCaches = new()
    {
        ["A"] = new MemoryCache(new MemoryCacheOptions()),
        ["B"] = new MemoryCache(new MemoryCacheOptions())
    };

    public async Task<CacheResultDto<ProductDto>> ReadAsync(string server, bool distributed, int id)
    {
        var stopwatch = Stopwatch.StartNew();
        var logKey = CacheKeys.Distributed($"server-{server.ToLower()}", id);

        if (distributed)
        {
            var key = CacheKeys.Distributed("shared", id);
            try
            {
                var json = await distributedCache.GetStringAsync(key);
                if (json is not null)
                {
                    log.Add(logKey, "Hit", "Found in the shared distributed cache");
                    return JsonSerializer.Deserialize<ProductDto>(json).ToResult("Distributed cache", key, stopwatch, $"Served by server {server}");
                }

                var product = await LoadAsync(id);
                if (product is not null)
                {
                    await distributedCache.SetStringAsync(key, JsonSerializer.Serialize(product),
                        new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = Duration });
                }
                log.Add(logKey, "Miss", "Loaded from the database and stored in the shared cache");
                return product.ToResult("Database", key, stopwatch, $"Served by server {server}");
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                var product = await LoadAsync(id);
                log.Add(logKey, "Error", "Distributed cache failed, read the database instead");
                return product.ToResult("Database", key, stopwatch, $"Distributed cache unavailable: {ex.Message}");
            }
        }

        var localKey = CacheKeys.Distributed("local", id);
        var cache = serverCaches[server];
        if (cache.TryGetValue(localKey, out ProductDto? cached) && cached is not null)
        {
            log.Add(logKey, "Hit", $"Found in server {server}'s own memory");
            return cached.ToResult($"Server {server} memory", localKey, stopwatch);
        }

        var loaded = await LoadAsync(id);
        if (loaded is not null) cache.Set(localKey, loaded, Duration);
        log.Add(logKey, "Miss", $"Loaded from the database into server {server}'s memory");
        return loaded.ToResult("Database", localKey, stopwatch, $"Served by server {server}");
    }

    public async Task<CacheResultDto<ProductDto>> UpdatePriceAsync(string server, bool distributed, int id, decimal price)
    {
        var stopwatch = Stopwatch.StartNew();
        var logKey = CacheKeys.Distributed($"server-{server.ToLower()}", id);

        using var scope = scopeFactory.CreateScope();
        var product = (await scope.ServiceProvider.GetRequiredService<IProductRepository>().UpdatePriceAsync(id, price))?.ToDto();
        log.Add(logKey, "DbWrite", $"Server {server} updated the database to ${price}");

        if (distributed)
        {
            var key = CacheKeys.Distributed("shared", id);
            try
            {
                await distributedCache.RemoveAsync(key);
                log.Add(logKey, "Remove", "Removed from the shared cache, every server will see the change");
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                log.Add(logKey, "Error", $"Could not remove from the distributed cache: {ex.Message}");
            }
            return product.ToResult("Database", key, stopwatch);
        }

        var localKey = CacheKeys.Distributed("local", id);
        serverCaches[server].Remove(localKey);
        log.Add(logKey, "Remove", $"Removed only from server {server}'s memory. The other server does not know.");
        return product.ToResult("Database", localKey, stopwatch);
    }

    public async Task ResetAsync(int id)
    {
        foreach (var cache in serverCaches.Values) cache.Remove(CacheKeys.Distributed("local", id));
        try
        {
            await distributedCache.RemoveAsync(CacheKeys.Distributed("shared", id));
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            log.Add(CacheKeys.Distributed("server-a", id), "Error", ex.Message);
        }
    }

    public void Dispose()
    {
        foreach (var cache in serverCaches.Values) cache.Dispose();
    }

    private async Task<ProductDto?> LoadAsync(int id)
    {
        using var scope = scopeFactory.CreateScope();
        return (await scope.ServiceProvider.GetRequiredService<IProductRepository>().GetByIdAsync(id))?.ToDto();
    }
}
