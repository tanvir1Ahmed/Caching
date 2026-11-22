using System.Collections.Concurrent;
using Caching.Business.Dto;
using Caching.Business.Service.Interface;

namespace Caching.Business.Service.Implementation;

public class CacheEventLog : ICacheEventLog
{
    private const int MaxEvents = 200;
    private readonly ConcurrentQueue<CacheEventDto> events = new();

    public void Add(string key, string type, string detail)
    {
        events.Enqueue(new CacheEventDto { Time = DateTime.UtcNow, Key = key, Type = type, Detail = detail });
        while (events.Count > MaxEvents) events.TryDequeue(out _);
    }

    public IEnumerable<CacheEventDto> GetAll(string? prefix) =>
        events.Where(e => prefix is null || e.Key.StartsWith(prefix)).Reverse().ToList();

    public void Clear() => events.Clear();
}
