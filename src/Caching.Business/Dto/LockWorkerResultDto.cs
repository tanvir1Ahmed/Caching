namespace Caching.Business.Dto;

public class LockWorkerResultDto
{
    public string Worker { get; set; } = string.Empty;
    public double StartedAtMs { get; set; }
    public bool Acquired { get; set; }
    public double? FinishedAtMs { get; set; }
    public bool? Released { get; set; }
    public string Note { get; set; } = string.Empty;
}
