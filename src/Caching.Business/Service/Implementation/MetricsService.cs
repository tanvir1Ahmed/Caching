using Caching.Business.Dto;
using Caching.Business.Service.Interface;
using Caching.Infrastructure.Exceptions;
using Caching.Infrastructure.Repository.Interface;
using Microsoft.Extensions.Caching.Memory;

namespace Caching.Business.Service.Implementation;

public class MetricsService(IMemoryCache memoryCache, ICacheEventLog log, IRedisRepository redis) : IMetricsService
{
    public async Task<MetricsDashboardDto> GetAsync()
    {
        var dashboard = new MetricsDashboardDto
        {
            MemoryCache = MemoryStats(),
            EventsByType = log.TotalsByType().OrderByDescending(t => t.Value).ToDictionary(t => t.Key, t => t.Value),
            EventsByLevel = log.TotalsByLevel().OrderBy(t => t.Key).ToDictionary(t => t.Key, t => t.Value)
        };

        if (!redis.IsConfigured)
        {
            dashboard.RedisError = "Redis is not configured.";
            return dashboard;
        }

        try
        {
            var info = await redis.InfoAsync();
            long.TryParse(info.GetValueOrDefault("Stats.keyspace_hits"), out var hits);
            long.TryParse(info.GetValueOrDefault("Stats.keyspace_misses"), out var misses);
            dashboard.RedisAvailable = true;
            dashboard.RedisHits = hits;
            dashboard.RedisMisses = misses;
            dashboard.RedisHitRatio = hits + misses == 0 ? 0 : Math.Round(hits * 100.0 / (hits + misses), 2);
            dashboard.RedisMemory = info.GetValueOrDefault("Memory.used_memory_human");
            dashboard.RedisEvictedKeys = info.GetValueOrDefault("Stats.evicted_keys");
        }
        catch (CacheUnavailableException ex)
        {
            dashboard.RedisError = ex.Message;
        }

        return dashboard;
    }

    private CacheStatsDto MemoryStats()
    {
        var statistics = memoryCache.GetCurrentStatistics();
        if (statistics is null) return new CacheStatsDto();
        var total = statistics.TotalHits + statistics.TotalMisses;
        return new CacheStatsDto
        {
            Hits = statistics.TotalHits,
            Misses = statistics.TotalMisses,
            HitRatio = total == 0 ? 0 : Math.Round(statistics.TotalHits * 100.0 / total, 2),
            EntryCount = statistics.CurrentEntryCount
        };
    }
}
