namespace Caching.Business.Dto;

public class EvictionStateDto
{
    public long SizeLimit { get; set; }
    public long CurrentSize { get; set; }
    public double CompactionPercentage { get; set; }
    public List<EvictionEntryDto> Entries { get; set; } = [];
}
