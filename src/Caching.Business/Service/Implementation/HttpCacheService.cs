using System.Security.Cryptography;
using System.Text;
using Caching.Business.Constant;
using Caching.Business.Dto;
using Caching.Business.Mapper;
using Caching.Business.Service.Interface;
using Caching.Infrastructure.Repository.Interface;

namespace Caching.Business.Service.Implementation;

public class HttpCacheService(IProductRepository repository, IRequestCounter counter, ICacheEventLog log) : IHttpCacheService
{
    public async Task<HttpProductDto?> GetProductAsync(string scope, int id)
    {
        var requestNumber = counter.Increment(scope);
        var product = await repository.GetByIdAsync(id);
        log.Add(CacheKeys.Http(scope, id), "Executed", $"Action ran and read the database (server request #{requestNumber})");
        if (product is null) return null;

        var dto = product.ToDto();
        return new HttpProductDto
        {
            Product = dto,
            GeneratedAt = DateTime.UtcNow,
            RequestNumber = requestNumber,
            ETag = CreateETag(dto),
            LastModified = new DateTimeOffset(dto.UpdatedAt.Ticks - dto.UpdatedAt.Ticks % TimeSpan.TicksPerSecond, TimeSpan.Zero)
        };
    }

    private static string CreateETag(ProductDto product)
    {
        var content = $"{product.Id}|{product.Name}|{product.Price}|{product.UpdatedAt.Ticks}";
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(content));
        return $"\"{Convert.ToHexString(hash)[..16].ToLower()}\"";
    }
}
