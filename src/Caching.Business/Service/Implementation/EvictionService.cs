using System.Collections.Concurrent;
using Caching.Business.Constant;
using Caching.Business.Dto;
using Caching.Business.Service.Interface;
using Microsoft.Extensions.Caching.Memory;

namespace Caching.Business.Service.Implementation;

public class EvictionService(ICacheEventLog log) : IEvictionService, IDisposable
{
    private const long SizeLimit = 10;
    private const double CompactionPercentage = 0.5;

    private readonly MemoryCache cache = new(new MemoryCacheOptions
    {
        SizeLimit = SizeLimit,
        CompactionPercentage = CompactionPercentage,
        TrackStatistics = true
    });

    private readonly ConcurrentDictionary<string, EvictionEntryDto> entries = new();

    public AddEntryResultDto Add(AddEntryDto dto)
    {
        var key = CacheKeys.Eviction(dto.Key);
        var entry = new EvictionEntryDto
        {
            Key = dto.Key,
            Size = dto.Size,
            Priority = dto.Priority,
            AddedAt = DateTime.UtcNow,
            LastAccessedAt = DateTime.UtcNow
        };

        var options = new MemoryCacheEntryOptions { Size = dto.Size, Priority = dto.Priority };
        options.RegisterPostEvictionCallback((evictedKey, _, reason, _) =>
        {
            if (reason != EvictionReason.Replaced) entries.TryRemove(dto.Key, out _);
            log.Add(evictedKey.ToString()!, "Evicted", $"Reason: {reason}");
        });

        entries[dto.Key] = entry;
        cache.Set(key, dto.Key, options);

        if (cache.TryGetValue(key, out _))
        {
            log.Add(key, "Set", $"Stored with size {dto.Size} and priority {dto.Priority}");
            return new AddEntryResultDto { Stored = true, Message = $"'{dto.Key}' stored" };
        }

        entries.TryRemove(dto.Key, out _);
        log.Add(key, "Rejected", "Cache is full, entry was not stored and compaction started");
        return new AddEntryResultDto { Stored = false, Message = $"'{dto.Key}' rejected because the cache is full. Compaction started in the background." };
    }

    public bool Touch(string key)
    {
        if (!cache.TryGetValue(CacheKeys.Eviction(key), out _)) return false;
        if (entries.TryGetValue(key, out var entry)) entry.LastAccessedAt = DateTime.UtcNow;
        log.Add(CacheKeys.Eviction(key), "Hit", "Accessed, now the most recently used");
        return true;
    }

    public void Compact(double percentage)
    {
        log.Add(CacheKeys.Eviction("*"), "Compact", $"Manual compaction of {percentage * 100}% requested");
        cache.Compact(percentage);
    }

    public void Clear()
    {
        cache.Clear();
        entries.Clear();
    }

    public EvictionStateDto GetState() => new()
    {
        SizeLimit = SizeLimit,
        CurrentSize = cache.GetCurrentStatistics()?.CurrentEstimatedSize ?? 0,
        CompactionPercentage = CompactionPercentage,
        Entries = entries.Values.OrderBy(e => e.AddedAt).ToList()
    };

    public void Dispose() => cache.Dispose();
}
