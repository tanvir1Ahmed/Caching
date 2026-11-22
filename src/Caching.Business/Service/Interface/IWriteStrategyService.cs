using Caching.Business.Dto;

namespace Caching.Business.Service.Interface;

public interface IWriteStrategyService
{
    Task<CacheResultDto<ProductDto>> GetAsync(string strategy, int id);
    Task<CacheResultDto<ProductDto>> WriteThroughAsync(int id, decimal price);
    Task<CacheResultDto<ProductDto>> WriteAroundAsync(int id, decimal price);
}
