# Project Rules

Read and follow these rules before making any change in this repository.

## Project type
- .NET 10 ASP.NET Core MVC application, used as an **API-only** project (controllers, no views).
- Use **Swagger only** (Swashbuckle) for API documentation/UI. Do not add Scalar, NSwag or Microsoft.AspNetCore.OpenApi.
- Use **both EF Core and Dapper** for data access.
- **Do not write any comments** in the code.
- Keep the code as simple as possible.

## Solution structure (three layers)
```
Caching.slnx
src/
  Caching.Core/              ASP.NET Core MVC Web API project (entry point)
    Controllers/
    Program.cs
  Caching.Business/          Class library - all business logic
    Service/
      Interface/
      Implementation/
    Dto/
    Mapper/
  Caching.Infrastructure/    Class library - all database and external API logic
    Repository/
      Interface/
      Implementation/
    Data/
      Entity/                database table classes
      DbContext/             DbContext class
```

## Layer rules
- **Core**: controllers only. Controllers depend on Business service interfaces and use DTOs. No business or database logic here.
- **Business**: all business logic. Services go in `Service/Interface` and `Service/Implementation`. DTOs go in `Dto`, mapping between entities and DTOs goes in `Mapper` (simple static mapper extension methods, no AutoMapper).
- **Infrastructure**: all database and external API logic. Repositories go in `Repository/Interface` and `Repository/Implementation`. Entities (tables) go in `Data/Entity`, the DbContext goes in `Data/DbContext`.
- Reference direction: `Core -> Business -> Infrastructure`. Never reference upward.
- Dependency registration: each library exposes an extension method in `DependencyInjection.cs` (`AddInfrastructure`, `AddBusiness`). `Program.cs` calls `AddBusiness`.
- Data access convention: Dapper for reads (queries), EF Core for writes (insert/update/delete).

## Packages
- EF Core packages must stay on version `10.0.x` (11.x targets net11.0 and does not work on net10.0).
