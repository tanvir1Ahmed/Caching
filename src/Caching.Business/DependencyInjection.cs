using Caching.Business.Service.Implementation;
using Caching.Business.Service.Interface;
using Caching.Infrastructure;
using Microsoft.Extensions.DependencyInjection;

namespace Caching.Business;

public static class DependencyInjection
{
    public static IServiceCollection AddBusiness(this IServiceCollection services, string connectionString)
    {
        services.AddInfrastructure(connectionString);
        services.AddScoped<IProductService, ProductService>();
        return services;
    }
}
