using Caching.Business.Dto;

namespace Caching.Business.Service.Interface;

public interface IAvalancheService
{
    List<AvalancheResultDto> Warm();
    Dictionary<string, int> CountAlive();
}
