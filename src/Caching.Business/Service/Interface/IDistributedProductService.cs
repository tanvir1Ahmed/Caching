using Caching.Business.Dto;

namespace Caching.Business.Service.Interface;

public interface IDistributedProductService
{
    Task<CacheResultDto<ProductDto>> GetAsync(int id);
    Task RemoveAsync(int id);
    Task RefreshAsync(int id);
    Task<RedisEntryDto> InspectAsync(int id);
}
