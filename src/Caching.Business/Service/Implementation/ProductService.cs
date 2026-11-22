using Caching.Business.Dto;
using Caching.Business.Mapper;
using Caching.Business.Service.Interface;
using Caching.Infrastructure.Repository.Interface;

namespace Caching.Business.Service.Implementation;

public class ProductService(IProductRepository repository) : IProductService
{
    public async Task<IEnumerable<ProductDto>> GetAllAsync()
    {
        var products = await repository.GetAllAsync();
        return products.Select(p => p.ToDto());
    }

    public async Task<ProductDto?> GetByIdAsync(int id)
    {
        var product = await repository.GetByIdAsync(id);
        return product?.ToDto();
    }

    public async Task<ProductDto> CreateAsync(CreateProductDto dto)
    {
        var product = await repository.AddAsync(dto.ToEntity());
        return product.ToDto();
    }

    public Task<bool> UpdateAsync(int id, CreateProductDto dto)
    {
        var product = dto.ToEntity();
        product.Id = id;
        return repository.UpdateAsync(product);
    }

    public Task<bool> DeleteAsync(int id) => repository.DeleteAsync(id);
}
