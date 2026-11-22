using System.Text.Json.Serialization;
using Caching.Business;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllersWithViews()
    .AddJsonOptions(options => options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddBusiness(builder.Configuration);

var app = builder.Build();

app.Services.ApplyDatabaseMigrations();

app.UseSwagger();
app.UseSwaggerUI();

app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseRouting();
app.UseAuthorization();

app.MapControllers();
app.MapControllerRoute("default", "{controller=Home}/{action=Index}/{id?}");

app.Run();
