using Caching.Business.Dto;

namespace Caching.Business.Service.Interface;

public interface IRateLimiterService
{
    Task<RateLimitResultDto> CheckAsync(string client);
}
