using Caching.Business.Dto;

namespace Caching.Business.Service.Interface;

public interface IRefreshAheadService
{
    Task<CacheResultDto<ProductDto>> GetAsync(int id);
}
