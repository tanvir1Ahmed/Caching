namespace Caching.Business.Dto;

public class RedisCommandResultDto
{
    public string Command { get; set; } = string.Empty;
    public object? Result { get; set; }
    public double ElapsedMs { get; set; }
}
