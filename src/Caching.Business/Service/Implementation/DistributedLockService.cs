using System.Diagnostics;
using Caching.Business.Constant;
using Caching.Business.Dto;
using Caching.Business.Service.Interface;
using Caching.Infrastructure.Repository.Interface;

namespace Caching.Business.Service.Implementation;

public class DistributedLockService(IRedisRepository redis, ICacheEventLog log) : IDistributedLockService
{
    private static readonly string LockKey = CacheKeys.Redis("lock:daily-report");

    public async Task<List<LockWorkerResultDto>> RunWorkersAsync(int workers, int workMs, int lockMs, int startIntervalMs)
    {
        await redis.DeleteAsync(LockKey);
        var clock = Stopwatch.StartNew();
        var tasks = Enumerable.Range(1, workers).Select(i => RunWorkerAsync($"Worker {i}", (i - 1) * startIntervalMs, workMs, lockMs, clock));
        return (await Task.WhenAll(tasks)).ToList();
    }

    private async Task<LockWorkerResultDto> RunWorkerAsync(string worker, int startDelayMs, int workMs, int lockMs, Stopwatch clock)
    {
        await Task.Delay(startDelayMs);
        var token = $"{worker}:{Guid.NewGuid():N}";
        var result = new LockWorkerResultDto { Worker = worker, StartedAtMs = clock.Elapsed.TotalMilliseconds };

        result.Acquired = await redis.LockTakeAsync(LockKey, token, TimeSpan.FromMilliseconds(lockMs));
        if (!result.Acquired)
        {
            result.Note = "Lock is held by another worker, skipped the job";
            log.Add(LockKey, "Blocked", $"{worker} could not get the lock");
            return result;
        }

        log.Add(LockKey, "Acquired", $"{worker} got the lock (expires in {lockMs} ms) and started working");
        await Task.Delay(workMs);
        result.FinishedAtMs = clock.Elapsed.TotalMilliseconds;
        result.Released = await redis.LockReleaseAsync(LockKey, token);
        result.Note = result.Released.Value
            ? "Finished and released its own lock"
            : "Finished, but its lock had already expired. Release refused because the token did not match.";
        log.Add(LockKey, result.Released.Value ? "Released" : "Expired", $"{worker}: {result.Note}");
        return result;
    }
}
