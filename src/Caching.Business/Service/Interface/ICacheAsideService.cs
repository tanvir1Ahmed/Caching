using Caching.Business.Dto;

namespace Caching.Business.Service.Interface;

public interface ICacheAsideService
{
    Task<CacheResultDto<ProductDto>> GetAsync(int id);
}
