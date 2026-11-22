using Caching.Business.Service.Implementation;
using Caching.Business.Service.Interface;
using Caching.Infrastructure;
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

        return services;
    }

    public static void ApplyDatabaseMigrations(this IServiceProvider serviceProvider) =>
        serviceProvider.MigrateDatabase();
}
