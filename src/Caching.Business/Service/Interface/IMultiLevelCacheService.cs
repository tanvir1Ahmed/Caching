using Caching.Business.Dto;

namespace Caching.Business.Service.Interface;

public interface IMultiLevelCacheService : IRedisSubscriber
{
    Task<CacheResultDto<ProductDto>> GetAsync(int id);
    Task<CacheResultDto<ProductDto>> UpdatePriceAsync(int id, decimal price);
    Task<HotKeyResultDto> HammerAsync(int id, int requests);
    void ClearLocal();
}
