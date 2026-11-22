using System;
using Caching.Infrastructure.Data.DbContext;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

#nullable disable

namespace Caching.Infrastructure.Data.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20261122074112_AddProductUpdatedAt")]
    partial class AddProductUpdatedAt
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

                    b.Property<DateTime>("UpdatedAt")
                        .HasColumnType("TEXT");

                    b.HasKey("Id");

                    b.ToTable("Products");

                    b.HasData(
                        new
                        {
                            Id = 1,
                            Name = "Laptop",
                            Price = 1200m,
                            UpdatedAt = new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc)
                        },
                        new
                        {
                            Id = 2,
                            Name = "Mouse",
                            Price = 25m,
                            UpdatedAt = new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc)
                        },
                        new
                        {
                            Id = 3,
                            Name = "Keyboard",
                            Price = 45m,
                            UpdatedAt = new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc)
                        },
                        new
                        {
                            Id = 4,
                            Name = "Monitor",
                            Price = 300m,
                            UpdatedAt = new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc)
                        },
                        new
                        {
                            Id = 5,
                            Name = "Headphones",
                            Price = 80m,
                            UpdatedAt = new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc)
                        },
                        new
                        {
                            Id = 6,
                            Name = "Webcam",
                            Price = 60m,
                            UpdatedAt = new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc)
                        },
                        new
                        {
                            Id = 7,
                            Name = "Microphone",
                            Price = 110m,
                            UpdatedAt = new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc)
                        },
                        new
                        {
                            Id = 8,
                            Name = "Desk Lamp",
                            Price = 35m,
                            UpdatedAt = new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc)
                        },
                        new
                        {
                            Id = 9,
                            Name = "USB Hub",
                            Price = 20m,
                            UpdatedAt = new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc)
                        },
                        new
                        {
                            Id = 10,
                            Name = "External SSD",
                            Price = 150m,
                            UpdatedAt = new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc)
                        });
                });
#pragma warning restore 612, 618
        }
    }
}
