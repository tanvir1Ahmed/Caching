using Caching.Infrastructure.Data;
using Caching.Infrastructure.Exceptions;
using Caching.Infrastructure.Repository.Interface;
using StackExchange.Redis;
using StackExchange.Redis.KeyspaceIsolation;

namespace Caching.Infrastructure.Repository.Implementation;

public class RedisRepository(RedisConnection redis) : IRedisRepository
{
    public bool IsConfigured => redis.IsConfigured;

    private IDatabase Database => redis.Multiplexer.GetDatabase().WithKeyPrefix(RedisConnection.KeyPrefix);

    private IServer Server => redis.Multiplexer.GetServers().FirstOrDefault(s => s.IsConnected)
        ?? throw new CacheUnavailableException("Redis is configured but no server is connected.");

    public Task<double> PingAsync() => Execute(async () => (await Database.PingAsync()).TotalMilliseconds);

    public Task<string?> StringGetAsync(string key) => Execute(async () => (string?)await Database.StringGetAsync(key));

    public Task StringSetAsync(string key, string value, TimeSpan? expiry = null) =>
        Execute(() => expiry is null ? Database.StringSetAsync(key, value) : Database.StringSetAsync(key, value, expiry.Value));

    public Task<long> IncrementAsync(string key, TimeSpan? expiryWhenCreated = null) => Execute(async () =>
    {
        var value = await Database.StringIncrementAsync(key);
        if (value == 1 && expiryWhenCreated is not null) await Database.KeyExpireAsync(key, expiryWhenCreated);
        return value;
    });

    public Task<TimeSpan?> TimeToLiveAsync(string key) => Execute(() => Database.KeyTimeToLiveAsync(key));

    public Task<bool> DeleteAsync(string key) => Execute(() => Database.KeyDeleteAsync(key));

    public Task<string> KeyTypeAsync(string key) => Execute(async () => (await Database.KeyTypeAsync(key)).ToString().ToLower());

    public Task<List<string>> ScanKeysAsync(string pattern, int max = 100) => Execute(async () =>
    {
        var keys = new List<string>();
        await foreach (var key in Server.KeysAsync(pattern: RedisConnection.KeyPrefix + pattern, pageSize: 250))
        {
            keys.Add(key.ToString()[RedisConnection.KeyPrefix.Length..]);
            if (keys.Count >= max) break;
        }
        return keys.Order().ToList();
    });

    public Task HashSetAsync(string key, IDictionary<string, string> fields) =>
        Execute(() => Database.HashSetAsync(key, fields.Select(f => new HashEntry(f.Key, f.Value)).ToArray()));

    public Task<Dictionary<string, string>> HashGetAllAsync(string key) => Execute(async () =>
        (await Database.HashGetAllAsync(key)).ToDictionary(e => e.Name.ToString(), e => e.Value.ToString()));

    public Task<long> HashIncrementAsync(string key, string field, long value) =>
        Execute(() => Database.HashIncrementAsync(key, field, value));

    public Task<long> ListPushAsync(string key, string value, int maxLength) => Execute(async () =>
    {
        var length = await Database.ListLeftPushAsync(key, value);
        await Database.ListTrimAsync(key, 0, maxLength - 1);
        return Math.Min(length, maxLength);
    });

    public Task<List<string>> ListRangeAsync(string key) => Execute(async () =>
        (await Database.ListRangeAsync(key)).Select(v => v.ToString()).ToList());

    public Task<bool> SetAddAsync(string key, string value) => Execute(() => Database.SetAddAsync(key, value));

    public Task<List<string>> SetMembersAsync(string key) => Execute(async () =>
        (await Database.SetMembersAsync(key)).Select(v => v.ToString()).Order().ToList());

    public Task<double> SortedSetIncrementAsync(string key, string member, double value) =>
        Execute(() => Database.SortedSetIncrementAsync(key, member, value));

    public Task<List<(string Member, double Score)>> SortedSetTopAsync(string key, int count) => Execute(async () =>
        (await Database.SortedSetRangeByRankWithScoresAsync(key, 0, count - 1, Order.Descending))
            .Select(e => (e.Element.ToString(), e.Score)).ToList());

    public Task<long?> SortedSetRankAsync(string key, string member) =>
        Execute(() => Database.SortedSetRankAsync(key, member, Order.Descending));

    public Task<long> PublishAsync(string channel, string message) =>
        Execute(() => redis.Multiplexer.GetSubscriber().PublishAsync(RedisChannel.Literal(RedisConnection.KeyPrefix + channel), message));

    public Task SubscribeAsync(string channel, Action<string> handler) =>
        Execute(() => redis.Multiplexer.GetSubscriber().SubscribeAsync(
            RedisChannel.Literal(RedisConnection.KeyPrefix + channel), (_, message) => handler(message.ToString())));

    public Task<bool> LockTakeAsync(string key, string token, TimeSpan expiry) => Execute(() => Database.LockTakeAsync(key, token, expiry));

    public Task<bool> LockReleaseAsync(string key, string token) => Execute(() => Database.LockReleaseAsync(key, token));

    public Task<Dictionary<string, string>> InfoAsync() => Execute(async () =>
        (await Server.InfoAsync()).SelectMany(group => group.Select(item => (Key: $"{group.Key}.{item.Key}", item.Value)))
            .ToDictionary(item => item.Key, item => item.Value));

    private static async Task Execute(Func<Task> action) => await Execute(async () =>
    {
        await action();
        return true;
    });

    private static async Task<T> Execute<T>(Func<Task<T>> action)
    {
        try
        {
            return await action();
        }
        catch (Exception ex) when (ex is not OperationCanceledException and not CacheUnavailableException)
        {
            throw new CacheUnavailableException($"Redis error: {ex.Message}", ex);
        }
    }
}
