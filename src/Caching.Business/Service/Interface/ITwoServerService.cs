using Caching.Business.Dto;

namespace Caching.Business.Service.Interface;

public interface ITwoServerService
{
    Task<CacheResultDto<ProductDto>> ReadAsync(string server, bool distributed, int id);
    Task<CacheResultDto<ProductDto>> UpdatePriceAsync(string server, bool distributed, int id, decimal price);
    Task ResetAsync(int id);
}
