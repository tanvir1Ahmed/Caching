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

public class WriteBehindService(IServiceScopeFactory scopeFactory, IMemoryCache cache, ICacheEventLog log) : IWriteBehindService
{
    private readonly ConcurrentDictionary<int, PendingWriteDto> pending = new();
    private long totalUpdates;
    private long totalWrites;

    public int FlushIntervalSeconds => 10;
    public DateTime? NextFlushAt { get; set; }

    public async Task<CacheResultDto<ProductDto>> GetAsync(int id)
    {
        var stopwatch = Stopwatch.StartNew();
        var key = CacheKeys.Strategy(Strategy.WriteBehind, id);

        if (cache.TryGetValue(key, out ProductDto? cached) && cached is not null)
        {
            log.Add(key, "Hit", "Read from cache");
            return cached.ToResult("Cache", key, stopwatch);
        }

        var product = await LoadAsync(id);
        if (product is not null) cache.Set(key, product, TimeSpan.FromMinutes(5));
        log.Add(key, "Miss", "Not cached, reading the database");
        return product.ToResult("Database", key, stopwatch);
    }

    public async Task<CacheResultDto<ProductDto>> UpdatePriceAsync(int id, decimal price)
    {
        var stopwatch = Stopwatch.StartNew();
        var key = CacheKeys.Strategy(Strategy.WriteBehind, id);

        if (!cache.TryGetValue(key, out ProductDto? product) || product is null)
        {
            product = await LoadAsync(id);
            if (product is null) return product.ToResult("Database", key, stopwatch, "Product not found");
        }

        var updated = new ProductDto { Id = product.Id, Name = product.Name, Price = price, UpdatedAt = DateTime.UtcNow };
        cache.Set(key, updated, TimeSpan.FromMinutes(5));
        Interlocked.Increment(ref totalUpdates);

        pending.AddOrUpdate(id,
            _ => new PendingWriteDto { ProductId = id, Price = price, Updates = 1, FirstQueuedAt = DateTime.UtcNow },
            (_, existing) =>
            {
                existing.Price = price;
                existing.Updates++;
                return existing;
            });

        log.Add(key, "Set", $"Cache updated to ${price} now, database write queued");
        return updated.ToResult("Cache", key, stopwatch, "The database has not been written yet");
    }

    public async Task<int> FlushAsync()
    {
        if (pending.IsEmpty) return 0;

        using var scope = scopeFactory.CreateScope();
        var repository = scope.ServiceProvider.GetRequiredService<IProductRepository>();
        var written = 0;

        foreach (var id in pending.Keys.ToList())
        {
            if (!pending.TryRemove(id, out var write)) continue;
            await repository.UpdatePriceAsync(write.ProductId, write.Price);
            Interlocked.Increment(ref totalWrites);
            written++;
            log.Add(CacheKeys.Strategy(Strategy.WriteBehind, id), "DbWrite",
                $"Flushed ${write.Price} to the database ({write.Updates} update(s) combined into 1 write)");
        }

        return written;
    }

    public WriteBehindStateDto GetState() => new()
    {
        Pending = pending.Values.OrderBy(p => p.FirstQueuedAt).ToList(),
        FlushIntervalSeconds = FlushIntervalSeconds,
        NextFlushAt = NextFlushAt,
        TotalUpdatesReceived = Interlocked.Read(ref totalUpdates),
        TotalDatabaseWrites = Interlocked.Read(ref totalWrites)
    };

    private async Task<ProductDto?> LoadAsync(int id)
    {
        using var scope = scopeFactory.CreateScope();
        var repository = scope.ServiceProvider.GetRequiredService<IProductRepository>();
        return (await repository.GetByIdAsync(id))?.ToDto();
    }
}
