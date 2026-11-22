namespace Caching.Business.Dto;

public class RedisKeyDto
{
    public string Key { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public double? TtlSeconds { get; set; }
}
