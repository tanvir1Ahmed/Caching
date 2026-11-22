using Caching.Business.Dto;
using Caching.Infrastructure.Data.Entity;

namespace Caching.Business.Mapper;

public static class ProductMapper
{
    public static ProductDto ToDto(this Product product) => new()
    {
        Id = product.Id,
        Name = product.Name,
        Price = product.Price,
        UpdatedAt = DateTime.SpecifyKind(product.UpdatedAt, DateTimeKind.Utc)
    };

    public static Product ToEntity(this CreateProductDto dto) => new()
    {
        Name = dto.Name,
        Price = dto.Price
    };
}
