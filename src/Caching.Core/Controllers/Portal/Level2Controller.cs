using Microsoft.AspNetCore.Mvc;

namespace Caching.Core.Controllers.Portal;

[ApiExplorerSettings(IgnoreApi = true)]
public class Level2Controller : Controller
{
    public IActionResult Index() => View();

    public IActionResult Validation() => View();

    public IActionResult ResponseCaching() => View();

    public IActionResult OutputCaching() => View();

    public IActionResult Cdn() => View();
}
