using Caching.Infrastructure.Data.DbContext;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

#nullable disable

namespace Caching.Infrastructure.Data.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20261122034843_InitialCreate")]
    partial class InitialCreate
    {
        protected override void BuildTargetModel(ModelBuilder modelBuilder)
        {
#pragma warning disable 612, 618
            modelBuilder.HasAnnotation("ProductVersion", "10.0.15");

            modelBuilder.Entity("Caching.Infrastructure.Data.Entity.Product", b =>
                {
                    b.Property<int>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("INTEGER");

                    b.Property<string>("Name")
                        .IsRequired()
                        .HasMaxLength(200)
                        .HasColumnType("TEXT");

                    b.Property<decimal>("Price")
                        .HasPrecision(18, 2)
                        .HasColumnType("TEXT");

                    b.HasKey("Id");

                    b.ToTable("Products");

                    b.HasData(
                        new
                        {
                            Id = 1,
                            Name = "Laptop",
                            Price = 1200m
                        },
                        new
                        {
                            Id = 2,
                            Name = "Mouse",
                            Price = 25m
                        },
                        new
                        {
                            Id = 3,
                            Name = "Keyboard",
                            Price = 45m
                        },
                        new
                        {
                            Id = 4,
                            Name = "Monitor",
                            Price = 300m
                        },
                        new
                        {
                            Id = 5,
                            Name = "Headphones",
                            Price = 80m
                        },
                        new
                        {
                            Id = 6,
                            Name = "Webcam",
                            Price = 60m
                        },
                        new
                        {
                            Id = 7,
                            Name = "Microphone",
                            Price = 110m
                        },
                        new
                        {
                            Id = 8,
                            Name = "Desk Lamp",
                            Price = 35m
                        },
                        new
                        {
                            Id = 9,
                            Name = "USB Hub",
                            Price = 20m
                        },
                        new
                        {
                            Id = 10,
                            Name = "External SSD",
                            Price = 150m
                        });
                });
#pragma warning restore 612, 618
        }
    }
}
