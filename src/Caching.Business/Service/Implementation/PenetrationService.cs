using System.Diagnostics;
using Caching.Business.Dto;
using Caching.Business.Helper;
using Caching.Business.Mapper;
using Caching.Business.Service.Interface;
using Caching.Infrastructure.Repository.Interface;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection;

namespace Caching.Business.Service.Implementation;

public class PenetrationService(IServiceScopeFactory scopeFactory, ICacheEventLog log) : IPenetrationService, IDisposable
{
    public const string None = "none";
    public const string NullCache = "null-cache";
    public const string Bloom = "bloom";

    private const string NotFound = "NOT_FOUND";
    private static readonly TimeSpan FoundDuration = TimeSpan.FromSeconds(60);
    private static readonly TimeSpan NotFoundDuration = TimeSpan.FromSeconds(30);

    private MemoryCache cache = new(new MemoryCacheOptions());
    private BloomFilter? bloomFilter;
    private HashSet<int> existingIds = [];

    public async Task<LoadTestResultDto> RunAsync(string mode, string pattern, int requests)
    {
        await EnsureBloomFilterAsync();
        var old = cache;
        cache = new MemoryCache(new MemoryCacheOptions());
        old.Dispose();

        var ids = pattern switch
        {
            "repeated" => Enumerable.Repeat(999999, requests).ToList(),
            "random" => Enumerable.Range(0, requests).Select(_ => Random.Shared.Next(100000, 999999)).ToList(),
            _ => Enumerable.Range(0, requests).Select(_ => Random.Shared.Next(1, 11)).ToList()
        };

        long databaseCalls = 0;
        long hits = 0;
        long rejected = 0;
        var stopwatch = Stopwatch.StartNew();

        foreach (var id in ids)
        {
            var key = $"level7:penetration:{mode}:product:{id}";

            if (mode == Bloom && !bloomFilter!.MightContain(id.ToString()))
            {
                rejected++;
                continue;
            }

            if (cache.TryGetValue(key, out object? cached))
            {
                hits++;
                continue;
            }

            databaseCalls++;
            var product = await LoadAsync(id);
            if (product is not null) cache.Set(key, (object)product, FoundDuration);
            else if (mode == NullCache) cache.Set(key, (object)NotFound, NotFoundDuration);
        }

        var note = $"{requests} requests ({pattern}): {databaseCalls} reached the database, {hits} were cache hits, {rejected} were rejected by the Bloom filter.";
        log.Add($"level7:penetration:{mode}", databaseCalls > hits + rejected ? "Miss" : "Hit", note);

        return new LoadTestResultDto
        {
            Mode = mode,
            Pattern = pattern,
            Requests = requests,
            DatabaseCalls = databaseCalls,
            CacheHits = hits,
            Rejected = rejected,
            ElapsedMs = stopwatch.Elapsed.TotalMilliseconds,
            Note = note
        };
    }

    public async Task<BloomFilterStateDto> GetBloomStateAsync(string? check)
    {
        await EnsureBloomFilterAsync();
        var filter = bloomFilter!;
        var state = new BloomFilterStateDto
        {
            SizeInBits = filter.SizeInBits,
            HashFunctions = filter.HashFunctions,
            ItemsAdded = filter.ItemsAdded,
            BitsSet = filter.BitsSet,
            EstimatedFalsePositiveRate = Math.Round(filter.EstimatedFalsePositiveRate * 100, 2),
            Bits = filter.ToBitString()
        };

        if (!string.IsNullOrWhiteSpace(check))
        {
            state.Checked = check.Trim();
            state.CheckedPositions = filter.Positions(state.Checked).ToList();
            state.MightContain = filter.MightContain(state.Checked);
            state.ActuallyExists = int.TryParse(state.Checked, out var id) && existingIds.Contains(id);
        }

        return state;
    }

    public void Dispose() => cache.Dispose();

    private async Task EnsureBloomFilterAsync()
    {
        if (bloomFilter is not null) return;
        using var scope = scopeFactory.CreateScope();
        var ids = await scope.ServiceProvider.GetRequiredService<IProductRepository>().GetAllIdsAsync();
        var filter = new BloomFilter(64, 3);
        existingIds = ids.ToHashSet();
        foreach (var id in existingIds) filter.Add(id.ToString());
        bloomFilter = filter;
    }

    private async Task<ProductDto?> LoadAsync(int id)
    {
        using var scope = scopeFactory.CreateScope();
        return (await scope.ServiceProvider.GetRequiredService<IProductRepository>().GetByIdAsync(id))?.ToDto();
    }
}
