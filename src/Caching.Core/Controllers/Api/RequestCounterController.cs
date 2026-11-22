using Caching.Business.Service.Interface;
using Microsoft.AspNetCore.Mvc;

namespace Caching.Core.Controllers.Api;

[ApiController]
[Route("api/level2/counters")]
public class RequestCounterController(IRequestCounter counter) : ControllerBase
{
    [HttpGet]
    public IActionResult GetAll() => Ok(counter.GetAll());

    [HttpDelete]
    public IActionResult Reset()
    {
        counter.Reset();
        return NoContent();
    }
}
