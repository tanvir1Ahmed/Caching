using Caching.Business.Dto;
using Caching.Business.Service.Interface;
using Microsoft.AspNetCore.Mvc;

namespace Caching.Core.Controllers.Api;

[ApiController]
[Route("api/level1/eviction")]
public class EvictionController(IEvictionService evictionService) : ControllerBase
{
    [HttpGet]
    public IActionResult GetState() => Ok(evictionService.GetState());

    [HttpPost("entries")]
    public IActionResult Add(AddEntryDto dto) => Ok(evictionService.Add(dto));

    [HttpPost("entries/{key}/touch")]
    public IActionResult Touch(string key) => evictionService.Touch(key) ? NoContent() : NotFound();

    [HttpPost("compact")]
    public IActionResult Compact(double percentage)
    {
        evictionService.Compact(percentage);
        return NoContent();
    }

    [HttpDelete]
    public IActionResult Clear()
    {
        evictionService.Clear();
        return NoContent();
    }
}
