using Microsoft.AspNetCore.Mvc;

namespace Caching.Core.Controllers.Portal;

[ApiExplorerSettings(IgnoreApi = true)]
public class Level4Controller : Controller
{
    public IActionResult Index() => View();

    public IActionResult DistributedCache() => View();

    public IActionResult Serialization() => View();

    public IActionResult HybridCache() => View();
}
