using Caching.Business.Dto;

namespace Caching.Business.Service.Interface;

public interface IRedisInfoService
{
    Task<RedisInfoDto> GetAsync();
}
