namespace Caching.Business.Dto;

public class CacheResultDto<T>
{
    public T? Data { get; set; }
    public string Source { get; set; } = string.Empty;
    public string Key { get; set; } = string.Empty;
    public double ElapsedMs { get; set; }
    public DateTime? CachedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public string? Note { get; set; }
}
