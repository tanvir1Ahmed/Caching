namespace Caching.Business.Dto;

public class MetricsDashboardDto
{
    public CacheStatsDto MemoryCache { get; set; } = new();
    public Dictionary<string, long> EventsByType { get; set; } = [];
    public Dictionary<string, long> EventsByLevel { get; set; } = [];
    public bool RedisAvailable { get; set; }
    public long RedisHits { get; set; }
    public long RedisMisses { get; set; }
    public double RedisHitRatio { get; set; }
    public string? RedisMemory { get; set; }
    public string? RedisEvictedKeys { get; set; }
    public string? RedisError { get; set; }
}
