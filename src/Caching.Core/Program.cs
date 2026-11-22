using System.Text.Json.Serialization;
using Caching.Business;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllersWithViews()
    .AddJsonOptions(options => options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddResponseCaching();
builder.Services.AddOutputCache(options =>
    options.AddPolicy("Products", policy => policy
        .Expire(TimeSpan.FromSeconds(30))
        .SetVaryByQuery("id")
        .Tag("products")));
builder.Services.AddBusiness(builder.Configuration);

var app = builder.Build();

app.Services.ApplyDatabaseMigrations();

app.UseSwagger();
app.UseSwaggerUI();

app.UseHttpsRedirection();
app.UseStaticFiles(new StaticFileOptions
{
    OnPrepareResponse = context =>
        context.Context.Response.Headers.CacheControl = context.Context.Request.Query.ContainsKey("v")
            ? "public, max-age=31536000, immutable"
            : "no-cache"
});
app.UseRouting();
app.UseResponseCaching();
app.UseOutputCache();
app.UseAuthorization();

app.MapControllers();
app.MapControllerRoute("default", "{controller=Home}/{action=Index}/{id?}");

app.Run();
