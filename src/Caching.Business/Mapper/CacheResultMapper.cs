using System.Diagnostics;
using Caching.Business.Dto;

namespace Caching.Business.Mapper;

public static class CacheResultMapper
{
    public static CacheResultDto<T> ToResult<T>(this T? data, string source, string key, Stopwatch stopwatch, string? note = null) => new()
    {
        Data = data,
        Source = source,
        Key = key,
        ElapsedMs = stopwatch.Elapsed.TotalMilliseconds,
        Note = note
    };
}
