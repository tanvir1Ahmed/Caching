using Microsoft.AspNetCore.Mvc;

namespace Caching.Core.Controllers.Portal;

[ApiExplorerSettings(IgnoreApi = true)]
public class HomeController(IConfiguration configuration) : Controller
{
    public IActionResult Index()
    {
        ViewBag.RedisConfigured = !string.IsNullOrWhiteSpace(configuration.GetConnectionString("Redis"));
        return View();
    }
}
