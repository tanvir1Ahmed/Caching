using Caching.Business.Constant;
using Caching.Business.Dto;
using Caching.Business.Service.Interface;
using Caching.Infrastructure.Repository.Interface;

namespace Caching.Business.Service.Implementation;

public class LeaderboardService(IRedisRepository redis, ICacheEventLog log) : ILeaderboardService
{
    private static readonly string Key = CacheKeys.Redis("leaderboard");

    public async Task<LeaderboardEntryDto> AddScoreAsync(string player, double points)
    {
        var score = await redis.SortedSetIncrementAsync(Key, player, points);
        var rank = await redis.SortedSetRankAsync(Key, player);
        log.Add(Key, "Set", $"ZINCRBY {player} {points}: total {score}, rank #{rank + 1}");
        return new LeaderboardEntryDto { Player = player, Score = score, Rank = (rank ?? 0) + 1 };
    }

    public async Task<List<LeaderboardEntryDto>> GetTopAsync(int count) =>
        (await redis.SortedSetTopAsync(Key, count))
            .Select((entry, index) => new LeaderboardEntryDto { Rank = index + 1, Player = entry.Member, Score = entry.Score })
            .ToList();
}
