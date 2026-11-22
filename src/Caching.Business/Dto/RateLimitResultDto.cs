namespace Caching.Business.Dto;

public class RateLimitResultDto
{
    public bool Allowed { get; set; }
    public long Count { get; set; }
    public int Limit { get; set; }
    public int WindowSeconds { get; set; }
    public double? ResetsInSeconds { get; set; }
    public string Key { get; set; } = string.Empty;
}
