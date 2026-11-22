using Caching.Business.Dto;

namespace Caching.Business.Service.Interface;

public interface ILeaderboardService
{
    Task<LeaderboardEntryDto> AddScoreAsync(string player, double points);
    Task<List<LeaderboardEntryDto>> GetTopAsync(int count);
}
