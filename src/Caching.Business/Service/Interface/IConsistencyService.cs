using Caching.Business.Dto;

namespace Caching.Business.Service.Interface;

public interface IConsistencyService
{
    Task<RaceResultDto> RunRaceAsync(string mode, int id);
}
