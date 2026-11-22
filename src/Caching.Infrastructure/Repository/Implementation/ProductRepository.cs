using Caching.Infrastructure.Data.DbContext;
using Caching.Infrastructure.Data.Entity;
using Caching.Infrastructure.Repository.Interface;
using Dapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace Caching.Infrastructure.Repository.Implementation;

public class ProductRepository(AppDbContext context, IConfiguration configuration) : IProductRepository
{
    private int SimulatedDelayMs => configuration.GetValue<int>("Database:SimulatedDelayMs");

    public async Task<IEnumerable<Product>> GetAllAsync()
    {
        await Task.Delay(SimulatedDelayMs);
        var connection = context.Database.GetDbConnection();
        return await connection.QueryAsync<Product>("SELECT Id, Name, Price FROM Products");
    }

    public async Task<Product?> GetByIdAsync(int id)
    {
        await Task.Delay(SimulatedDelayMs);
        var connection = context.Database.GetDbConnection();
        return await connection.QueryFirstOrDefaultAsync<Product>(
            "SELECT Id, Name, Price FROM Products WHERE Id = @Id", new { Id = id });
    }

    public async Task<Product> AddAsync(Product product)
    {
        context.Products.Add(product);
        await context.SaveChangesAsync();
        return product;
    }

    public async Task<bool> UpdateAsync(Product product)
    {
        var existing = await context.Products.FindAsync(product.Id);
        if (existing is null) return false;
        existing.Name = product.Name;
        existing.Price = product.Price;
        await context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var existing = await context.Products.FindAsync(id);
        if (existing is null) return false;
        context.Products.Remove(existing);
        await context.SaveChangesAsync();
        return true;
    }
}
