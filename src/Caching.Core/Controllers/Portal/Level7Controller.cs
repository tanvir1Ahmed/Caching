using Microsoft.AspNetCore.Mvc;

namespace Caching.Core.Controllers.Portal;

[ApiExplorerSettings(IgnoreApi = true)]
public class Level7Controller : Controller
{
    public IActionResult Index() => View();

    public IActionResult Penetration() => View();

    public IActionResult Avalanche() => View();

    public IActionResult MultiLevel() => View();

    public IActionResult Monitoring() => View();
}
