using Microsoft.AspNetCore.Mvc;

namespace Caching.Core.Controllers.Portal;

[ApiExplorerSettings(IgnoreApi = true)]
public class Level5Controller : Controller
{
    public IActionResult Index() => View();

    public IActionResult UseCases() => View();

    public IActionResult PubSubLocks() => View();

    public IActionResult Operations() => View();
}
