using System.Collections.Concurrent;
using System.Diagnostics;
using Caching.Business.Dto;
using Caching.Business.Mapper;
using Caching.Business.Service.Interface;
using Caching.Infrastructure.Repository.Interface;
using Microsoft.Extensions.Caching.Hybrid;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection;

namespace Caching.Business.Service.Implementation;

public class StampedeService(IServiceScopeFactory scopeFactory, HybridCache hybridCache, ICacheEventLog log) : IStampedeService, IDisposable
{
    public const string None = "none";
    public const string Lock = "lock";
    public const string Hybrid = "hybrid";

    private static readonly TimeSpan Duration = TimeSpan.FromSeconds(60);
    private readonly MemoryCache cache = new(new MemoryCacheOptions());
    private readonly ConcurrentDictionary<string, SemaphoreSlim> locks = new();

    public async Task<LoadTestResultDto> RunAsync(string mode, int id, int requests)
    {
        var key = $"level7:stampede:{mode}:product:{id}";
        cache.Remove(key);
        await hybridCache.RemoveAsync(key);

        long databaseCalls = 0;
        long hits = 0;

        async Task<ProductDto?> Load()
        {
            Interlocked.Increment(ref databaseCalls);
            using var scope = scopeFactory.CreateScope();
            return (await scope.ServiceProvider.GetRequiredService<IProductRepository>().GetByIdAsync(id))?.ToDto();
        }

        void Hit() => Interlocked.Increment(ref hits);

        var stopwatch = Stopwatch.StartNew();
        await Task.WhenAll(Enumerable.Range(0, requests).Select(_ => mode switch
        {
            Lock => GetWithLockAsync(key, Load, Hit),
            Hybrid => hybridCache.GetOrCreateAsync(key, async _ => await Load()).AsTask(),
            _ => GetWithoutProtectionAsync(key, Load, Hit)
        }));

        if (mode == Hybrid) hits = requests - databaseCalls;
        var note = $"{requests} requests arrived at the same moment on an empty cache. The database was queried {databaseCalls} time(s).";
        log.Add($"level7:stampede:{mode}", databaseCalls > 1 ? "Miss" : "Hit", note);

        return new LoadTestResultDto
        {
            Mode = mode,
            Pattern = "concurrent",
            Requests = requests,
            DatabaseCalls = databaseCalls,
            CacheHits = hits,
            ElapsedMs = stopwatch.Elapsed.TotalMilliseconds,
            Note = note
        };
    }

    private async Task<ProductDto?> GetWithoutProtectionAsync(string key, Func<Task<ProductDto?>> load, Action hit)
    {
        if (cache.TryGetValue(key, out ProductDto? cached))
        {
            hit();
            return cached;
        }

        var product = await load();
        cache.Set(key, product, Duration);
        return product;
    }

    private async Task<ProductDto?> GetWithLockAsync(string key, Func<Task<ProductDto?>> load, Action hit)
    {
        if (cache.TryGetValue(key, out ProductDto? cached))
        {
            hit();
            return cached;
        }

        var gate = locks.GetOrAdd(key, _ => new SemaphoreSlim(1, 1));
        await gate.WaitAsync();
        try
        {
            if (cache.TryGetValue(key, out cached))
            {
                hit();
                return cached;
            }

            var product = await load();
            cache.Set(key, product, Duration);
            return product;
        }
        finally
        {
            gate.Release();
        }
    }

    public void Dispose() => cache.Dispose();
}
