namespace Caching.Business.Dto;

public class HotKeyResultDto
{
    public int Requests { get; set; }
    public long L1Hits { get; set; }
    public long L2Hits { get; set; }
    public long DatabaseCalls { get; set; }
    public double ElapsedMs { get; set; }
}
