using System.Diagnostics;
using System.Text.Json;
using Caching.Business.Dto;
using Caching.Business.Mapper;
using Caching.Business.Service.Interface;
using Caching.Infrastructure.Exceptions;
using Caching.Infrastructure.Repository.Interface;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection;

namespace Caching.Business.Service.Implementation;

public class MultiLevelCacheService(IServiceScopeFactory scopeFactory, IRedisRepository redis, ICacheEventLog log) : IMultiLevelCacheService, IDisposable
{
    public const string Channel = "level7:invalidate";

    private static readonly TimeSpan L1Duration = TimeSpan.FromSeconds(30);
    private static readonly TimeSpan L2Duration = TimeSpan.FromSeconds(120);

    private MemoryCache l1 = new(new MemoryCacheOptions());
    private bool subscribed;

    private static string Key(int id) => $"level7:multi:product:{id}";

    public async Task SubscribeAsync()
    {
        if (subscribed || !redis.IsConfigured) return;
        await redis.SubscribeAsync(Channel, message =>
        {
            if (!int.TryParse(message, out var id)) return;
            l1.Remove(Key(id));
            log.Add(Key(id), "Received", "Invalidation message from Redis Pub/Sub: removed from this server's L1");
        });
        subscribed = true;
    }

    public async Task<CacheResultDto<ProductDto>> GetAsync(int id)
    {
        var stopwatch = Stopwatch.StartNew();
        var (product, source, note) = await GetInternalAsync(id);
        return product.ToResult(source, Key(id), stopwatch, note);
    }

    public async Task<CacheResultDto<ProductDto>> UpdatePriceAsync(int id, decimal price)
    {
        var stopwatch = Stopwatch.StartNew();
        using var scope = scopeFactory.CreateScope();
        var product = (await scope.ServiceProvider.GetRequiredService<IProductRepository>().UpdatePriceAsync(id, price))?.ToDto();
        log.Add(Key(id), "DbWrite", $"Database updated to ${price}");

        try
        {
            await redis.DeleteAsync(Key(id));
            var receivers = await redis.PublishAsync(Channel, id.ToString());
            log.Add(Key(id), "Published", $"L2 entry deleted and invalidation published to {receivers} server(s)");
            return product.ToResult("Database", Key(id), stopwatch, $"Invalidation broadcast to {receivers} server(s)");
        }
        catch (CacheUnavailableException ex)
        {
            l1.Remove(Key(id));
            log.Add(Key(id), "Error", "Redis unavailable: removed from local L1 only. Other servers stay stale until their L1 expires.");
            return product.ToResult("Database", Key(id), stopwatch, ex.Message);
        }
    }

    public async Task<HotKeyResultDto> HammerAsync(int id, int requests)
    {
        long l1Hits = 0, l2Hits = 0, databaseCalls = 0;
        var stopwatch = Stopwatch.StartNew();

        for (var i = 0; i < requests; i++)
        {
            var (_, source, _) = await GetInternalAsync(id, logHits: false);
            if (source == "L1") l1Hits++;
            else if (source == "L2") l2Hits++;
            else databaseCalls++;
        }

        log.Add(Key(id), "Hit", $"{requests} reads of one hot key: {l1Hits} L1, {l2Hits} L2 (Redis), {databaseCalls} database");
        return new HotKeyResultDto
        {
            Requests = requests,
            L1Hits = l1Hits,
            L2Hits = l2Hits,
            DatabaseCalls = databaseCalls,
            ElapsedMs = stopwatch.Elapsed.TotalMilliseconds
        };
    }

    public void ClearLocal()
    {
        var old = l1;
        l1 = new MemoryCache(new MemoryCacheOptions());
        old.Dispose();
        log.Add("level7:multi:l1", "Remove", "L1 cleared, as on a freshly started server");
    }

    public void Dispose() => l1.Dispose();

    private async Task<(ProductDto? Product, string Source, string? Note)> GetInternalAsync(int id, bool logHits = true)
    {
        var key = Key(id);
        if (l1.TryGetValue(key, out ProductDto? local) && local is not null)
        {
            if (logHits) log.Add(key, "Hit", "L1: this server's memory");
            return (local, "L1", null);
        }

        string? note = null;
        try
        {
            var json = await redis.StringGetAsync(key);
            if (json is not null)
            {
                var shared = JsonSerializer.Deserialize<ProductDto>(json);
                l1.Set(key, shared, L1Duration);
                if (logHits) log.Add(key, "Hit", "L2: Redis. Copied into L1");
                return (shared, "L2", null);
            }
        }
        catch (CacheUnavailableException ex)
        {
            note = $"L2 skipped: {ex.Message}";
        }

        using var scope = scopeFactory.CreateScope();
        var product = (await scope.ServiceProvider.GetRequiredService<IProductRepository>().GetByIdAsync(id))?.ToDto();
        if (product is null) return (null, "Database", "Product not found");

        if (note is null)
        {
            try
            {
                await redis.StringSetAsync(key, JsonSerializer.Serialize(product), L2Duration);
            }
            catch (CacheUnavailableException ex)
            {
                note = $"L2 skipped: {ex.Message}";
            }
        }

        l1.Set(key, product, L1Duration);
        log.Add(key, "Miss", note is null ? "Loaded from the database into L2 and L1" : "Loaded from the database into L1 only");
        return (product, "Database", note);
    }
}
