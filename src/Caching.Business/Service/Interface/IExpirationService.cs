using Caching.Business.Constant;
using Caching.Business.Dto;

namespace Caching.Business.Service.Interface;

public interface IExpirationService
{
    Task<CacheResultDto<ProductDto>> GetAsync(ExpirationType type, int id);
    void Remove(ExpirationType type, int id);
    IEnumerable<ExpirationSettingDto> GetSettings();
}
