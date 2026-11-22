using System.Diagnostics;
using System.Text.Json;
using Caching.Business.Constant;
using Caching.Business.Dto;
using Caching.Business.Mapper;
using Caching.Business.Service.Interface;
using Caching.Infrastructure.Exceptions;
using Caching.Infrastructure.Repository.Interface;
using Microsoft.Extensions.Caching.Distributed;

namespace Caching.Business.Service.Implementation;

public class DistributedProductService(
    IProductRepository repository,
    IDistributedCache cache,
    IRedisRepository redis,
    ICacheEventLog log) : IDistributedProductService
{
    private static readonly DistributedCacheEntryOptions Options = new()
    {
        AbsoluteExpirationRelativeToNow = TimeSpan.FromSeconds(120),
        SlidingExpiration = TimeSpan.FromSeconds(30)
    };

    public async Task<CacheResultDto<ProductDto>> GetAsync(int id)
    {
        var stopwatch = Stopwatch.StartNew();
        var key = CacheKeys.Distributed("distributed", id);

        try
        {
            var bytes = await cache.GetAsync(key);
            if (bytes is not null)
            {
                log.Add(key, "Hit", $"Read {bytes.Length} bytes from {cache.GetType().Name} and deserialized them");
                return JsonSerializer.Deserialize<ProductDto>(bytes).ToResult("Distributed cache", key, stopwatch);
            }

            log.Add(key, "Miss", "Not in the distributed cache, reading the database");
            var product = (await repository.GetByIdAsync(id))?.ToDto();
            if (product is null) return product.ToResult("Database", key, stopwatch, "Product not found");

            var json = JsonSerializer.SerializeToUtf8Bytes(product);
            await cache.SetAsync(key, json, Options);
            log.Add(key, "Set", $"Serialized to {json.Length} bytes and stored (absolute 120 s, sliding 30 s)");
            return product.ToResult("Database", key, stopwatch);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            log.Add(key, "Error", "Cache failed, falling back to the database");
            var product = (await repository.GetByIdAsync(id))?.ToDto();
            return product.ToResult("Database", key, stopwatch, $"Cache unavailable, the app kept working: {ex.Message}");
        }
    }

    public async Task RemoveAsync(int id)
    {
        var key = CacheKeys.Distributed("distributed", id);
        await cache.RemoveAsync(key);
        log.Add(key, "Remove", "Removed from the distributed cache");
    }

    public async Task RefreshAsync(int id)
    {
        var key = CacheKeys.Distributed("distributed", id);
        await cache.RefreshAsync(key);
        log.Add(key, "Refresh", "Sliding expiration reset without reading the value");
    }

    public async Task<RedisEntryDto> InspectAsync(int id)
    {
        var key = CacheKeys.Distributed("distributed", id);
        var entry = new RedisEntryDto { Key = key };
        if (!redis.IsConfigured)
        {
            entry.Note = "Redis is not configured, so the distributed cache is in-process memory and cannot be inspected.";
            return entry;
        }

        try
        {
            entry.Type = await redis.KeyTypeAsync(key);
            entry.Exists = entry.Type != "none";
            if (!entry.Exists) return entry;
            entry.TtlSeconds = (await redis.TimeToLiveAsync(key))?.TotalSeconds;
            entry.Fields = await redis.HashGetAllAsync(key);
        }
        catch (CacheUnavailableException ex)
        {
            entry.Note = ex.Message;
        }

        return entry;
    }
}
