using Microsoft.AspNetCore.Mvc;

namespace Caching.Core.Controllers.Portal;

[ApiExplorerSettings(IgnoreApi = true)]
public class Level1Controller : Controller
{
    public IActionResult Index() => View();

    public IActionResult FirstCache() => View();

    public IActionResult Expiration() => View();

    public IActionResult Eviction() => View();
}
