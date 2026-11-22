using Caching.Business.Dto;

namespace Caching.Business.Service.Interface;

public interface IDistributedLockService
{
    Task<List<LockWorkerResultDto>> RunWorkersAsync(int workers, int workMs, int lockMs, int startIntervalMs);
}
