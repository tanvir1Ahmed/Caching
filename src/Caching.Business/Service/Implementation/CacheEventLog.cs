using System.Collections.Concurrent;
using System.Diagnostics.Metrics;
using Caching.Business.Dto;
using Caching.Business.Service.Interface;

namespace Caching.Business.Service.Implementation;

public class CacheEventLog : ICacheEventLog
{
    public const string MeterName = "Caching.Academy";

    private const int MaxEvents = 200;
    private static readonly Meter Meter = new(MeterName);
    private static readonly Counter<long> EventCounter = Meter.CreateCounter<long>("caching_academy.cache_events", description: "Cache events by type and level");

    private readonly ConcurrentQueue<CacheEventDto> events = new();
    private readonly ConcurrentDictionary<string, long> totalsByType = new();
    private readonly ConcurrentDictionary<string, long> totalsByLevel = new();

    public void Add(string key, string type, string detail)
    {
        var level = key.Split(':')[0];
        events.Enqueue(new CacheEventDto { Time = DateTime.UtcNow, Key = key, Type = type, Detail = detail });
        while (events.Count > MaxEvents) events.TryDequeue(out _);

        totalsByType.AddOrUpdate(type, 1, (_, count) => count + 1);
        totalsByLevel.AddOrUpdate(level, 1, (_, count) => count + 1);
        EventCounter.Add(1, new KeyValuePair<string, object?>("type", type), new KeyValuePair<string, object?>("level", level));
    }

    public IEnumerable<CacheEventDto> GetAll(string? prefix) =>
        events.Where(e => prefix is null || e.Key.StartsWith(prefix)).Reverse().ToList();

    public IDictionary<string, long> TotalsByType() => new Dictionary<string, long>(totalsByType);

    public IDictionary<string, long> TotalsByLevel() => new Dictionary<string, long>(totalsByLevel);

    public void Clear() => events.Clear();
}
