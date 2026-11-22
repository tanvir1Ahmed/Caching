using Caching.Business.Service.Interface;
using Microsoft.Extensions.Hosting;

namespace Caching.Business.Service.Implementation;

public class WriteBehindWorker(IWriteBehindService writeBehindService) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var interval = TimeSpan.FromSeconds(writeBehindService.FlushIntervalSeconds);
        while (!stoppingToken.IsCancellationRequested)
        {
            writeBehindService.NextFlushAt = DateTime.UtcNow.Add(interval);
            await Task.Delay(interval, stoppingToken);
            await writeBehindService.FlushAsync();
        }
    }
}
