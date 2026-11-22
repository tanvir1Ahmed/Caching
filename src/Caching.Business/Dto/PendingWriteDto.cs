namespace Caching.Business.Dto;

public class PendingWriteDto
{
    public int ProductId { get; set; }
    public decimal Price { get; set; }
    public int Updates { get; set; }
    public DateTime FirstQueuedAt { get; set; }
}
