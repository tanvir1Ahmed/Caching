using Caching.Business.Dto;

namespace Caching.Business.Service.Interface;

public interface IRedisPlaygroundService
{
    Task<RedisCommandResultDto> ExecuteAsync(string operation, string? value);
    Task<List<RedisKeyDto>> GetKeysAsync(string pattern);
    Task<int> DeleteKeysAsync(string pattern);
}
