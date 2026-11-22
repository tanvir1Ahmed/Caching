namespace Caching.Infrastructure.Repository.Interface;

public interface IRedisRepository
{
    bool IsConfigured { get; }
    Task<double> PingAsync();
    Task<string?> StringGetAsync(string key);
    Task StringSetAsync(string key, string value, TimeSpan? expiry = null);
    Task<long> IncrementAsync(string key, TimeSpan? expiryWhenCreated = null);
    Task<TimeSpan?> TimeToLiveAsync(string key);
    Task<bool> DeleteAsync(string key);
    Task<string> KeyTypeAsync(string key);
    Task<List<string>> ScanKeysAsync(string pattern, int max = 100);
    Task HashSetAsync(string key, IDictionary<string, string> fields);
    Task<Dictionary<string, string>> HashGetAllAsync(string key);
    Task<long> HashIncrementAsync(string key, string field, long value);
    Task<long> ListPushAsync(string key, string value, int maxLength);
    Task<List<string>> ListRangeAsync(string key);
    Task<bool> SetAddAsync(string key, string value);
    Task<List<string>> SetMembersAsync(string key);
    Task<double> SortedSetIncrementAsync(string key, string member, double value);
    Task<List<(string Member, double Score)>> SortedSetTopAsync(string key, int count);
    Task<long?> SortedSetRankAsync(string key, string member);
    Task<long> PublishAsync(string channel, string message);
    Task SubscribeAsync(string channel, Action<string> handler);
    Task<bool> LockTakeAsync(string key, string token, TimeSpan expiry);
    Task<bool> LockReleaseAsync(string key, string token);
    Task<Dictionary<string, string>> InfoAsync();
}
