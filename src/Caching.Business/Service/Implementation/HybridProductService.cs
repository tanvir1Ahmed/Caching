using System.Diagnostics;
using Caching.Business.Constant;
using Caching.Business.Dto;
using Caching.Business.Mapper;
using Caching.Business.Service.Interface;
using Caching.Infrastructure.Repository.Interface;
using Microsoft.Extensions.Caching.Hybrid;
using Microsoft.Extensions.DependencyInjection;

namespace Caching.Business.Service.Implementation;

public class HybridProductService(HybridCache cache, IServiceScopeFactory scopeFactory, IRequestCounter counter, ICacheEventLog log) : IHybridProductService
{
    public const string CounterScope = "hybrid";

    private static readonly HybridCacheEntryOptions Options = new()
    {
        Expiration = TimeSpan.FromSeconds(60),
        LocalCacheExpiration = TimeSpan.FromSeconds(20)
    };

    private static readonly string[] Tags = ["products"];

    public async Task<CacheResultDto<ProductDto>> GetAsync(int id, bool skipLocal)
    {
        var stopwatch = Stopwatch.StartNew();
        var key = CacheKeys.Distributed("hybrid", id);
        var loaded = false;
        var options = skipLocal
            ? new HybridCacheEntryOptions { Expiration = Options.Expiration, LocalCacheExpiration = Options.LocalCacheExpiration, Flags = HybridCacheEntryFlags.DisableLocalCacheRead }
            : Options;

        var product = await cache.GetOrCreateAsync(key, async token =>
        {
            loaded = true;
            return await LoadAsync(id, key);
        }, options, Tags);

        var elapsed = stopwatch.Elapsed.TotalMilliseconds;
        var source = loaded ? "Database" : skipLocal || elapsed >= 1 ? "L2" : "L1";
        if (!loaded) log.Add(key, "Hit", source == "L1" ? "Served from L1 (this server's memory)" : "Served from L2 (the distributed cache)");
        return product.ToResult(source, key, stopwatch);
    }

    public async Task<ParallelResultDto> GetParallelAsync(int id, int requests)
    {
        var key = CacheKeys.Distributed("hybrid", id);
        var before = counter.Get(CounterScope);
        var stopwatch = Stopwatch.StartNew();

        await Task.WhenAll(Enumerable.Range(0, requests).Select(_ =>
            cache.GetOrCreateAsync(key, async token => await LoadAsync(id, key), Options, Tags).AsTask()));

        var runs = counter.Get(CounterScope) - before;
        return new ParallelResultDto
        {
            Requests = requests,
            LoaderRuns = runs,
            ElapsedMs = stopwatch.Elapsed.TotalMilliseconds,
            Note = runs == 0 ? "Everything was already cached" : $"{requests} concurrent requests, the database was read {runs} time(s)"
        };
    }

    public async Task RemoveAsync(int id)
    {
        var key = CacheKeys.Distributed("hybrid", id);
        await cache.RemoveAsync(key);
        log.Add(key, "Remove", "Removed from L1 and L2");
    }

    public async Task RemoveByTagAsync(string tag)
    {
        await cache.RemoveByTagAsync(tag);
        log.Add($"level4:hybrid:tag:{tag}", "Remove", $"Every entry tagged '{tag}' is now invalid");
    }

    private async Task<ProductDto?> LoadAsync(int id, string key)
    {
        counter.Increment(CounterScope);
        log.Add(key, "Miss", "HybridCache called the factory, reading the database");
        using var scope = scopeFactory.CreateScope();
        return (await scope.ServiceProvider.GetRequiredService<IProductRepository>().GetByIdAsync(id))?.ToDto();
    }
}
