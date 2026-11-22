using Caching.Business.Constant;
using Caching.Business.Service.Interface;
using Microsoft.AspNetCore.Mvc;

namespace Caching.Core.Controllers.Api;

[ApiController]
[Route("api/level1/expiration")]
public class ExpirationController(IExpirationService expirationService) : ControllerBase
{
    [HttpGet("settings")]
    public IActionResult GetSettings() => Ok(expirationService.GetSettings());

    [HttpGet("{type}/products/{id:int}")]
    public async Task<IActionResult> Get(ExpirationType type, int id) => Ok(await expirationService.GetAsync(type, id));

    [HttpDelete("{type}/products/{id:int}")]
    public IActionResult Remove(ExpirationType type, int id)
    {
        expirationService.Remove(type, id);
        return NoContent();
    }
}
