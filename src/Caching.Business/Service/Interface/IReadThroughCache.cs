using Caching.Business.Dto;

namespace Caching.Business.Service.Interface;

public interface IReadThroughCache<TValue>
{
    Task<CacheResultDto<TValue>> GetAsync(int id);
}
