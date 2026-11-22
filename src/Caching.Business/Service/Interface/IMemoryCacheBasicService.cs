using Caching.Business.Dto;

namespace Caching.Business.Service.Interface;

public interface IMemoryCacheBasicService
{
    Task<CacheResultDto<ProductDto>> GetWithoutCacheAsync(int id);
    Task<CacheResultDto<ProductDto>> GetWithCacheAsync(int id);
    void Remove(int id);
    CacheStatsDto GetStats();
}
