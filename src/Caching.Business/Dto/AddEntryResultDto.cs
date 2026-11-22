namespace Caching.Business.Dto;

public class AddEntryResultDto
{
    public bool Stored { get; set; }
    public string Message { get; set; } = string.Empty;
}
