namespace Caching.Business.Dto;

public class SerializationResultDto
{
    public string Format { get; set; } = string.Empty;
    public long Bytes { get; set; }
    public double SerializeMs { get; set; }
    public double DeserializeMs { get; set; }
    public double PercentOfJson { get; set; }
}
