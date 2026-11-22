using Caching.Infrastructure.Data.Entity;
using Microsoft.EntityFrameworkCore;

namespace Caching.Infrastructure.Data.DbContext;

public class AppDbContext(DbContextOptions<AppDbContext> options) : Microsoft.EntityFrameworkCore.DbContext(options)
{
    public DbSet<Product> Products => Set<Product>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Product>().Property(p => p.Name).HasMaxLength(200);
        modelBuilder.Entity<Product>().Property(p => p.Price).HasPrecision(18, 2);
        modelBuilder.Entity<Product>().HasData(
            new Product { Id = 1, Name = "Laptop", Price = 1200m },
            new Product { Id = 2, Name = "Mouse", Price = 25m },
            new Product { Id = 3, Name = "Keyboard", Price = 45m },
            new Product { Id = 4, Name = "Monitor", Price = 300m },
            new Product { Id = 5, Name = "Headphones", Price = 80m },
            new Product { Id = 6, Name = "Webcam", Price = 60m },
            new Product { Id = 7, Name = "Microphone", Price = 110m },
            new Product { Id = 8, Name = "Desk Lamp", Price = 35m },
            new Product { Id = 9, Name = "USB Hub", Price = 20m },
            new Product { Id = 10, Name = "External SSD", Price = 150m });
    }
}
