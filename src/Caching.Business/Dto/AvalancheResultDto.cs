namespace Caching.Business.Dto;

public class AvalancheResultDto
{
    public string Mode { get; set; } = string.Empty;
    public int Entries { get; set; }
    public int TtlSeconds { get; set; }
    public int JitterPercent { get; set; }
    public DateTime WarmedAt { get; set; }
    public List<int> ExpiriesPerSecond { get; set; } = [];
    public int PeakPerSecond { get; set; }
}
