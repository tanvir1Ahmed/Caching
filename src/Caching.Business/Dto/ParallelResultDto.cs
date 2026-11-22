namespace Caching.Business.Dto;

public class ParallelResultDto
{
    public int Requests { get; set; }
    public long LoaderRuns { get; set; }
    public double ElapsedMs { get; set; }
    public string? Note { get; set; }
}
