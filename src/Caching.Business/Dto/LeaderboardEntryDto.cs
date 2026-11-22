namespace Caching.Business.Dto;

public class LeaderboardEntryDto
{
    public long Rank { get; set; }
    public string Player { get; set; } = string.Empty;
    public double Score { get; set; }
}
