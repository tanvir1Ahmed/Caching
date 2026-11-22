using Microsoft.Extensions.Caching.Memory;

namespace Caching.Business.Dto;

public class EvictionEntryDto
{
    public string Key { get; set; } = string.Empty;
    public int Size { get; set; }
    public CacheItemPriority Priority { get; set; }
    public DateTime AddedAt { get; set; }
    public DateTime LastAccessedAt { get; set; }
}
