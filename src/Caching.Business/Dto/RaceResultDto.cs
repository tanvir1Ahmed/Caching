namespace Caching.Business.Dto;

public class RaceResultDto
{
    public string Mode { get; set; } = string.Empty;
    public List<RaceStepDto> Steps { get; set; } = [];
    public decimal? OldPrice { get; set; }
    public decimal NewPrice { get; set; }
    public decimal? CachedPriceAtEnd { get; set; }
    public decimal DatabasePriceAtEnd { get; set; }
    public bool Consistent { get; set; }
}
