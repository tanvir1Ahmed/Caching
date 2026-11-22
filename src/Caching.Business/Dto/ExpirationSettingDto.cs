namespace Caching.Business.Dto;

public class ExpirationSettingDto
{
    public string Type { get; set; } = string.Empty;
    public int? AbsoluteSeconds { get; set; }
    public int? SlidingSeconds { get; set; }
}
