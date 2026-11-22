namespace Caching.Business.Dto;

public class RedisInfoDto
{
    public Dictionary<string, string> Server { get; set; } = [];
    public long KeyspaceHits { get; set; }
    public long KeyspaceMisses { get; set; }
    public double HitRatio { get; set; }
    public List<RedisKeyDto> CourseKeys { get; set; } = [];
}
