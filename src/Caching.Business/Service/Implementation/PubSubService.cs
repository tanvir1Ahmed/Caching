using Caching.Business.Constant;
using Caching.Business.Service.Interface;
using Caching.Infrastructure.Repository.Interface;

namespace Caching.Business.Service.Implementation;

public class PubSubService(IRedisRepository redis, ICacheEventLog log) : IPubSubService
{
    public const string Channel = "level5:messages";

    public bool IsSubscribed { get; private set; }

    public async Task SubscribeAsync()
    {
        if (IsSubscribed || !redis.IsConfigured) return;
        await redis.SubscribeAsync(Channel, message =>
            log.Add(CacheKeys.Redis("pubsub:subscriber"), "Received", $"Subscriber got: {message}"));
        IsSubscribed = true;
        log.Add(CacheKeys.Redis("pubsub:subscriber"), "Subscribed", $"Listening on channel '{Channel}'");
    }

    public async Task<long> PublishAsync(string message)
    {
        var receivers = await redis.PublishAsync(Channel, message);
        log.Add(CacheKeys.Redis("pubsub:publisher"), "Published", $"PUBLISH {Channel} \"{message}\": delivered to {receivers} subscriber(s)");
        return receivers;
    }
}
