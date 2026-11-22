namespace Caching.Business.Dto;

public class LoadTestResultDto
{
    public string Mode { get; set; } = string.Empty;
    public string Pattern { get; set; } = string.Empty;
    public int Requests { get; set; }
    public long DatabaseCalls { get; set; }
    public long CacheHits { get; set; }
    public long Rejected { get; set; }
    public double ElapsedMs { get; set; }
    public string Note { get; set; } = string.Empty;
}
