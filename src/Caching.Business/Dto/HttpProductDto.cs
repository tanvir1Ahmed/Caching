namespace Caching.Business.Dto;

public class HttpProductDto
{
    public ProductDto Product { get; set; } = new();
    public DateTime GeneratedAt { get; set; }
    public long RequestNumber { get; set; }
    public string ETag { get; set; } = string.Empty;
    public DateTimeOffset LastModified { get; set; }
}
