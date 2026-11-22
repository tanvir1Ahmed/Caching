using Caching.Business.Dto;

namespace Caching.Business.Service.Interface;

public interface IInvalidationService
{
    Task<CacheResultDto<ProductDto>> ReadAsync(string strategy, int id);
    Task<CacheResultDto<ProductDto>> UpdatePriceAsync(int id, decimal price);
    void Reset();
    InvalidationStateDto GetState();
}
