using Microsoft.AspNetCore.Mvc;

namespace Caching.Core.Controllers.Portal;

[ApiExplorerSettings(IgnoreApi = true)]
public class HomeController : Controller
{
    public IActionResult Index() => View();
}
