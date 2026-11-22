using Caching.Business.Constant;
using Caching.Business.Dto;
using Caching.Business.Mapper;
using Caching.Business.Service.Implementation;
using Caching.Business.Service.Interface;
using Caching.Infrastructure;
using Caching.Infrastructure.Repository.Interface;
using Microsoft.Extensions.Caching.Hybrid;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Caching.Business;

public static class DependencyInjection
{
    public static IServiceCollection AddBusiness(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddInfrastructure(configuration);
        services.AddMemoryCache(options => options.TrackStatistics = true);

        services.AddScoped<IProductService, ProductService>();
        services.AddSingleton<ICacheEventLog, CacheEventLog>();
        services.AddScoped<IMemoryCacheBasicService, MemoryCacheBasicService>();
        services.AddScoped<IExpirationService, ExpirationService>();
        services.AddSingleton<IEvictionService, EvictionService>();
        services.AddSingleton<IRequestCounter, RequestCounter>();
        services.AddScoped<IHttpCacheService, HttpCacheService>();

        services.AddScoped<ICacheAsideService, CacheAsideService>();
        services.AddSingleton<IReadThroughCache<ProductDto>>(provider => new ReadThroughCache<ProductDto>(
            provider.GetRequiredService<IMemoryCache>(),
            provider.GetRequiredService<ICacheEventLog>(),
            $"level3:{Strategy.ReadThrough}:product",
            TimeSpan.FromSeconds(60),
            async id =>
            {
                using var scope = provider.CreateScope();
                var product = await scope.ServiceProvider.GetRequiredService<IProductRepository>().GetByIdAsync(id);
                return product?.ToDto();
            }));
        services.AddScoped<IWriteStrategyService, WriteStrategyService>();
        services.AddSingleton<IWriteBehindService, WriteBehindService>();
        services.AddHostedService<WriteBehindWorker>();
        services.AddSingleton<IRefreshAheadService, RefreshAheadService>();
        services.AddSingleton<IStrategyCacheService, StrategyCacheService>();

        services.AddHybridCache(options => options.DefaultEntryOptions = new HybridCacheEntryOptions
        {
            Expiration = TimeSpan.FromSeconds(60),
            LocalCacheExpiration = TimeSpan.FromSeconds(20)
        });
        services.AddScoped<IRedisStatusService, RedisStatusService>();
        services.AddSingleton<ITwoServerService, TwoServerService>();
        services.AddScoped<IDistributedProductService, DistributedProductService>();
        services.AddSingleton<ISerializationService, SerializationService>();
        services.AddSingleton<IHybridProductService, HybridProductService>();

        return services;
    }

    public static void ApplyDatabaseMigrations(this IServiceProvider serviceProvider) =>
        serviceProvider.MigrateDatabase();
}
