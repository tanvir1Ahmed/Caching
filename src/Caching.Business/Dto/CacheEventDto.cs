namespace Caching.Business.Dto;

public class CacheEventDto
{
    public DateTime Time { get; set; }
    public string Key { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Detail { get; set; } = string.Empty;
}
