using Caching.Business.Dto;

namespace Caching.Business.Service.Interface;

public interface IWriteBehindService
{
    int FlushIntervalSeconds { get; }
    DateTime? NextFlushAt { get; set; }
    Task<CacheResultDto<ProductDto>> GetAsync(int id);
    Task<CacheResultDto<ProductDto>> UpdatePriceAsync(int id, decimal price);
    Task<int> FlushAsync();
    WriteBehindStateDto GetState();
}
