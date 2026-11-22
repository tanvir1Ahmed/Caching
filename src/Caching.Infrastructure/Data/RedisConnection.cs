using Caching.Infrastructure.Exceptions;
using StackExchange.Redis;

namespace Caching.Infrastructure.Data;

public class RedisConnection(string? connectionString)
{
    public const string KeyPrefix = "caching-academy:";

    private readonly Lazy<IConnectionMultiplexer?> connection = new(() =>
    {
        if (string.IsNullOrWhiteSpace(connectionString)) return null;
        var options = ConfigurationOptions.Parse(connectionString);
        options.AllowAdmin = true;
        options.AbortOnConnectFail = false;
        options.ConnectTimeout = 3000;
        options.SyncTimeout = 2000;
        options.AsyncTimeout = 2000;
        return ConnectionMultiplexer.Connect(options);
    });

    public bool IsConfigured => !string.IsNullOrWhiteSpace(connectionString);

    public IConnectionMultiplexer Multiplexer => connection.Value
        ?? throw new CacheUnavailableException("Redis is not configured. Set ConnectionStrings:Redis.");
}
