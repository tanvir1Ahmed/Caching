using System.Diagnostics;
using Caching.Business.Constant;
using Caching.Business.Dto;
using Caching.Business.Service.Interface;
using Caching.Infrastructure.Repository.Interface;

namespace Caching.Business.Service.Implementation;

public class RedisPlaygroundService(IRedisRepository redis) : IRedisPlaygroundService
{
    private static readonly string Greeting = CacheKeys.Redis("greeting");
    private static readonly string PageViews = CacheKeys.Redis("page-views");
    private static readonly string Product = CacheKeys.Redis("product:1");
    private static readonly string Activity = CacheKeys.Redis("recent-activity");
    private static readonly string Visitors = CacheKeys.Redis("unique-visitors");

    public async Task<RedisCommandResultDto> ExecuteAsync(string operation, string? value)
    {
        var stopwatch = Stopwatch.StartNew();
        var text = string.IsNullOrWhiteSpace(value) ? "hello" : value.Trim();

        (string Command, object? Result) outcome = operation switch
        {
            "string-set" => ($"SET {Greeting} \"{text}\" EX 60", await Run(() => redis.StringSetAsync(Greeting, text, TimeSpan.FromSeconds(60)), "OK")),
            "string-get" => ($"GET {Greeting}", await redis.StringGetAsync(Greeting) ?? "(nil)"),
            "string-incr" => ($"INCR {PageViews}", await redis.IncrementAsync(PageViews)),
            "hash-set" => ($"HSET {Product} name \"Laptop\" price 1200 stock 5", await Run(() => redis.HashSetAsync(Product,
                new Dictionary<string, string> { ["name"] = "Laptop", ["price"] = "1200", ["stock"] = "5" }), "OK")),
            "hash-get" => ($"HGETALL {Product}", await redis.HashGetAllAsync(Product)),
            "hash-incr" => ($"HINCRBY {Product} stock -1", await redis.HashIncrementAsync(Product, "stock", -1)),
            "list-push" => ($"LPUSH {Activity} \"{text}\" + LTRIM 0 4", await redis.ListPushAsync(Activity, $"{DateTime.UtcNow:HH:mm:ss} {text}", 5)),
            "list-range" => ($"LRANGE {Activity} 0 -1", await redis.ListRangeAsync(Activity)),
            "set-add" => ($"SADD {Visitors} \"{text}\"", await redis.SetAddAsync(Visitors, text) ? "1 (added)" : "0 (already a member)"),
            "set-members" => ($"SMEMBERS {Visitors}", await redis.SetMembersAsync(Visitors)),
            _ => ("unknown", "Unknown operation")
        };

        return new RedisCommandResultDto
        {
            Command = outcome.Command,
            Result = outcome.Result,
            ElapsedMs = stopwatch.Elapsed.TotalMilliseconds
        };
    }

    public async Task<List<RedisKeyDto>> GetKeysAsync(string pattern)
    {
        var keys = await redis.ScanKeysAsync(pattern);
        var result = new List<RedisKeyDto>();
        foreach (var key in keys)
        {
            result.Add(new RedisKeyDto
            {
                Key = key,
                Type = await redis.KeyTypeAsync(key),
                TtlSeconds = (await redis.TimeToLiveAsync(key))?.TotalSeconds
            });
        }
        return result;
    }

    public async Task<int> DeleteKeysAsync(string pattern)
    {
        var keys = await redis.ScanKeysAsync(pattern, 1000);
        foreach (var key in keys) await redis.DeleteAsync(key);
        return keys.Count;
    }

    private static async Task<object?> Run(Func<Task> action, string result)
    {
        await action();
        return result;
    }
}
