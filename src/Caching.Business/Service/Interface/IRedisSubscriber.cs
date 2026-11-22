namespace Caching.Business.Service.Interface;

public interface IRedisSubscriber
{
    Task SubscribeAsync();
}
