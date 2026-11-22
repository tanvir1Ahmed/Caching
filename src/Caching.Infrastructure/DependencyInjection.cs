using Caching.Infrastructure.Data;
using Caching.Infrastructure.Data.DbContext;
using Caching.Infrastructure.Repository.Implementation;
using Caching.Infrastructure.Repository.Interface;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using StackExchange.Redis;

namespace Caching.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<AppDbContext>(options =>
            options.UseSqlite(configuration.GetConnectionString("DefaultConnection")));
        services.AddScoped<IProductRepository, ProductRepository>();

        var redis = new RedisConnection(configuration.GetConnectionString("Redis"));
        services.AddSingleton(redis);
        services.AddSingleton<IRedisRepository, RedisRepository>();

        if (redis.IsConfigured)
        {
            services.AddSingleton<IConnectionMultiplexer>(_ => redis.Multiplexer);
            services.AddStackExchangeRedisCache(options =>
            {
                options.InstanceName = RedisConnection.KeyPrefix;
                options.ConnectionMultiplexerFactory = () => Task.FromResult(redis.Multiplexer);
            });
        }
        else
        {
            services.AddDistributedMemoryCache();
        }

        return services;
    }

    public static void MigrateDatabase(this IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        scope.ServiceProvider.GetRequiredService<AppDbContext>().Database.Migrate();
    }
}
