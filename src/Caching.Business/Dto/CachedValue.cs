namespace Caching.Business.Dto;

public class CachedValue<T>(T value, TimeSpan? absolute, TimeSpan? sliding)
{
    public T Value { get; } = value;
    public DateTime CachedAt { get; } = DateTime.UtcNow;
    public DateTime? AbsoluteExpiresAt { get; } = absolute is null ? null : DateTime.UtcNow.Add(absolute.Value);
    public TimeSpan? Sliding { get; } = sliding;
    public DateTime LastAccessedAt { get; set; } = DateTime.UtcNow;

    public DateTime? ExpiresAt
    {
        get
        {
            DateTime? slidingExpiresAt = Sliding is null ? null : LastAccessedAt.Add(Sliding.Value);
            if (slidingExpiresAt is null) return AbsoluteExpiresAt;
            if (AbsoluteExpiresAt is null) return slidingExpiresAt;
            return slidingExpiresAt < AbsoluteExpiresAt ? slidingExpiresAt : AbsoluteExpiresAt;
        }
    }
}
