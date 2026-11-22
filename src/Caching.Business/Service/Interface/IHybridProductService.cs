using Caching.Business.Dto;

namespace Caching.Business.Service.Interface;

public interface IHybridProductService
{
    Task<CacheResultDto<ProductDto>> GetAsync(int id, bool skipLocal);
    Task<ParallelResultDto> GetParallelAsync(int id, int requests);
    Task RemoveAsync(int id);
    Task RemoveByTagAsync(string tag);
}
