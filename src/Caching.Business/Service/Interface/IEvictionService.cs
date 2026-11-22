using Caching.Business.Dto;

namespace Caching.Business.Service.Interface;

public interface IEvictionService
{
    AddEntryResultDto Add(AddEntryDto dto);
    bool Touch(string key);
    void Compact(double percentage);
    void Clear();
    EvictionStateDto GetState();
}
