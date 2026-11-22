using Caching.Business.Service.Interface;
using Microsoft.Extensions.Hosting;

namespace Caching.Business.Service.Implementation;

public class RedisSubscriberWorker(IEnumerable<IRedisSubscriber> subscribers) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            var pending = 0;
            foreach (var subscriber in subscribers)
            {
                try
                {
                    await subscriber.SubscribeAsync();
                }
                catch (Exception)
                {
                    pending++;
                }
            }

            if (pending == 0) return;
            await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);
        }
    }
}
