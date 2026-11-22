namespace Caching.Business.Service.Interface;

public interface IPubSubService : IRedisSubscriber
{
    bool IsSubscribed { get; }
    Task<long> PublishAsync(string message);
}
