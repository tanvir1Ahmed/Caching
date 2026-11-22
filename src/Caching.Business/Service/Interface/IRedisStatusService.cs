using Caching.Business.Dto;

namespace Caching.Business.Service.Interface;

public interface IRedisStatusService
{
    Task<RedisStatusDto> GetAsync();
}
