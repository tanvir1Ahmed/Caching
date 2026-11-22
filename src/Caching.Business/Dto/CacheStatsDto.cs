namespace Caching.Business.Dto;

public class CacheStatsDto
{
    public long Hits { get; set; }
    public long Misses { get; set; }
    public double HitRatio { get; set; }
    public long EntryCount { get; set; }
    public long? EstimatedSize { get; set; }
}
