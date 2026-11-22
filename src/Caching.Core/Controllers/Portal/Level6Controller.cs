using Microsoft.AspNetCore.Mvc;

namespace Caching.Core.Controllers.Portal;

[ApiExplorerSettings(IgnoreApi = true)]
public class Level6Controller : Controller
{
    public IActionResult Index() => View();

    public IActionResult Consistency() => View();
}
