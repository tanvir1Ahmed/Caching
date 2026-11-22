using Caching.Business.Dto;

namespace Caching.Business.Service.Interface;

public interface IHttpCacheService
{
    Task<HttpProductDto?> GetProductAsync(string scope, int id);
}
