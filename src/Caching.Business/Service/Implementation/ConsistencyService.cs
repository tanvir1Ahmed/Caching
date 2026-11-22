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

public class ConsistencyService(IServiceScopeFactory scopeFactory, IMemoryCache cache) : IConsistencyService
{
    public const string Naive = "naive";
    public const string VersionCheck = "version-check";
    public const string DoubleDelete = "double-delete";

    private const int ReaderProcessingMs = 1500;
    private const int WriterStartMs = 900;
    private const int SecondDeleteDelayMs = 1200;
    private const int CheckAtMs = 3600;

    private readonly ConcurrentDictionary<int, long> versions = new();

    public async Task<RaceResultDto> RunRaceAsync(string mode, int id)
    {
        var key = CacheKeys.Invalidation("race", id);
        cache.Remove(key);
        var steps = new ConcurrentQueue<RaceStepDto>();
        var clock = Stopwatch.StartNew();
        void Step(string actor, string action) => steps.Enqueue(new RaceStepDto { AtMs = Math.Round(clock.Elapsed.TotalMilliseconds), Actor = actor, Action = action });

        var currentPrice = (await LoadAsync(id))?.Price ?? 0;
        clock.Restart();
        var newPrice = Math.Round(currentPrice + 10 + Random.Shared.Next(1, 90), 2);

        var reader = Task.Run(async () =>
        {
            var versionAtStart = versions.GetOrAdd(id, 0);
            Step("Reader", "Cache miss. Starts reading the database");
            var product = await LoadAsync(id);
            Step("Reader", $"Got price ${product?.Price} from the database (the OLD value)");
            Step("Reader", $"Busy for {ReaderProcessingMs} ms before writing to the cache (slow network, GC pause, heavy mapping...)");
            await Task.Delay(ReaderProcessingMs);

            if (mode == VersionCheck && versions.GetOrAdd(id, 0) != versionAtStart)
            {
                Step("Reader", "Version changed while I was reading. Skips writing the cache, my value is outdated");
                return;
            }

            cache.Set(key, product, TimeSpan.FromMinutes(5));
            Step("Reader", $"Writes ${product?.Price} into the cache");
        });

        var writer = Task.Run(async () =>
        {
            await Task.Delay(WriterStartMs);
            Step("Writer", $"Starts updating the price to ${newPrice}");
            using var scope = scopeFactory.CreateScope();
            await scope.ServiceProvider.GetRequiredService<IProductRepository>().UpdatePriceAsync(id, newPrice);
            Step("Writer", "Database committed the new price");
            versions.AddOrUpdate(id, 1, (_, v) => v + 1);
            cache.Remove(key);
            Step("Writer", "Deletes the cache key (delete on write)");

            if (mode == DoubleDelete)
            {
                await Task.Delay(SecondDeleteDelayMs);
                cache.Remove(key);
                Step("Writer", $"Deletes the cache key again after {SecondDeleteDelayMs} ms (delayed double delete)");
            }
        });

        await Task.WhenAll(reader, writer);
        var remaining = CheckAtMs - clock.Elapsed.TotalMilliseconds;
        if (remaining > 0) await Task.Delay(TimeSpan.FromMilliseconds(remaining));

        var cached = cache.TryGetValue(key, out ProductDto? value) ? value : null;
        var database = await LoadAsync(id);
        Step("Check", cached is null
            ? $"Cache is empty, the next read loads ${database?.Price}"
            : $"Cache holds ${cached.Price}, database holds ${database?.Price}");

        return new RaceResultDto
        {
            Mode = mode,
            Steps = steps.OrderBy(s => s.AtMs).ToList(),
            OldPrice = currentPrice,
            NewPrice = newPrice,
            CachedPriceAtEnd = cached?.Price,
            DatabasePriceAtEnd = database?.Price ?? 0,
            Consistent = cached is null || cached.Price == database?.Price
        };
    }

    private async Task<ProductDto?> LoadAsync(int id)
    {
        using var scope = scopeFactory.CreateScope();
        return (await scope.ServiceProvider.GetRequiredService<IProductRepository>().GetByIdAsync(id))?.ToDto();
    }
}
