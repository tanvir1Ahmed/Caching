using Caching.Business.Dto;

namespace Caching.Business.Service.Interface;

public interface ICacheEventLog
{
    void Add(string key, string type, string detail);
    IEnumerable<CacheEventDto> GetAll(string? prefix);
    void Clear();
}
