using Caching.Business.Dto;
using Caching.Business.Service.Interface;
using Microsoft.Extensions.Caching.Memory;

namespace Caching.Business.Service.Implementation;

public class AvalancheService(ICacheEventLog log) : IAvalancheService, IDisposable
{
    private const int Entries = 200;
    private const int TtlSeconds = 20;
    private const int JitterPercent = 50;
    private static readonly string[] Modes = ["fixed", "jitter"];

    private MemoryCache cache = new(new MemoryCacheOptions());

    public List<AvalancheResultDto> Warm()
    {
        var old = cache;
        cache = new MemoryCache(new MemoryCacheOptions());
        old.Dispose();

        var results = new List<AvalancheResultDto>();
        foreach (var mode in Modes)
        {
            var jitter = mode == "jitter" ? JitterPercent : 0;
            var maxSeconds = TtlSeconds * (100 + JitterPercent) / 100;
            var buckets = new int[maxSeconds + 1];

            for (var i = 0; i < Entries; i++)
            {
                var spread = jitter == 0 ? 0 : (Random.Shared.NextDouble() * 2 - 1) * TtlSeconds * jitter / 100.0;
                var ttl = TimeSpan.FromSeconds(TtlSeconds + spread);
                cache.Set($"level7:avalanche:{mode}:product:{i}", i, ttl);
                buckets[(int)Math.Floor(ttl.TotalSeconds)]++;
            }

            results.Add(new AvalancheResultDto
            {
                Mode = mode,
                Entries = Entries,
                TtlSeconds = TtlSeconds,
                JitterPercent = jitter,
                WarmedAt = DateTime.UtcNow,
                ExpiriesPerSecond = buckets.ToList(),
                PeakPerSecond = buckets.Max()
            });
            log.Add($"level7:avalanche:{mode}", "Set", $"{Entries} entries cached, TTL {TtlSeconds} s, jitter {jitter}%. Peak: {buckets.Max()} expiries in one second.");
        }

        return results;
    }

    public Dictionary<string, int> CountAlive() => Modes.ToDictionary(
        mode => mode,
        mode => Enumerable.Range(0, Entries).Count(i => cache.TryGetValue($"level7:avalanche:{mode}:product:{i}", out _)));

    public void Dispose() => cache.Dispose();
}
