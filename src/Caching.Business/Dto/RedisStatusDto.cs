namespace Caching.Business.Dto;

public class RedisStatusDto
{
    public bool Configured { get; set; }
    public bool Connected { get; set; }
    public double? PingMs { get; set; }
    public string DistributedCacheProvider { get; set; } = string.Empty;
    public string? ServerVersion { get; set; }
    public string? UsedMemory { get; set; }
    public string? Error { get; set; }
}
