using Caching.Business.Dto;
using Caching.Business.Service.Interface;
using Caching.Infrastructure.Repository.Interface;

namespace Caching.Business.Service.Implementation;

public class RedisInfoService(IRedisRepository redis, IRedisPlaygroundService playground) : IRedisInfoService
{
    private static readonly string[] Fields =
    [
        "Server.redis_version", "Server.redis_mode", "Server.uptime_in_seconds",
        "Clients.connected_clients",
        "Memory.used_memory_human", "Memory.maxmemory_human", "Memory.maxmemory_policy",
        "Stats.total_commands_processed", "Stats.expired_keys", "Stats.evicted_keys",
        "Persistence.rdb_last_save_time", "Persistence.aof_enabled",
        "Replication.role", "Replication.connected_slaves"
    ];

    public async Task<RedisInfoDto> GetAsync()
    {
        var info = await redis.InfoAsync();
        long.TryParse(info.GetValueOrDefault("Stats.keyspace_hits"), out var hits);
        long.TryParse(info.GetValueOrDefault("Stats.keyspace_misses"), out var misses);

        return new RedisInfoDto
        {
            Server = Fields.Where(info.ContainsKey).ToDictionary(f => f, f => info[f]),
            KeyspaceHits = hits,
            KeyspaceMisses = misses,
            HitRatio = hits + misses == 0 ? 0 : Math.Round(hits * 100.0 / (hits + misses), 2),
            CourseKeys = await playground.GetKeysAsync("*")
        };
    }
}
