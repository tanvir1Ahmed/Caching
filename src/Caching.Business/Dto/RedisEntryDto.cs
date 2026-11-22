namespace Caching.Business.Dto;

public class RedisEntryDto
{
    public string Key { get; set; } = string.Empty;
    public bool Exists { get; set; }
    public string Type { get; set; } = string.Empty;
    public double? TtlSeconds { get; set; }
    public Dictionary<string, string> Fields { get; set; } = [];
    public string? Note { get; set; }
}
