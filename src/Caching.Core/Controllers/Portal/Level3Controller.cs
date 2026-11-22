using Microsoft.AspNetCore.Mvc;

namespace Caching.Core.Controllers.Portal;

[ApiExplorerSettings(IgnoreApi = true)]
public class Level3Controller : Controller
{
    public IActionResult Index() => View();

    public IActionResult WriteStrategies() => View();

    public IActionResult WriteBehind() => View();

    public IActionResult RefreshAhead() => View();
}
