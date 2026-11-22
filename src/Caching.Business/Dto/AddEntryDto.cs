using Microsoft.Extensions.Caching.Memory;

namespace Caching.Business.Dto;

public class AddEntryDto
{
    public string Key { get; set; } = string.Empty;
    public int Size { get; set; } = 1;
    public CacheItemPriority Priority { get; set; } = CacheItemPriority.Normal;
}
