namespace Caching.Business.Dto;

public class WriteBehindStateDto
{
    public List<PendingWriteDto> Pending { get; set; } = [];
    public int FlushIntervalSeconds { get; set; }
    public DateTime? NextFlushAt { get; set; }
    public long TotalUpdatesReceived { get; set; }
    public long TotalDatabaseWrites { get; set; }
}
