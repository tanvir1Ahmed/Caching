using Caching.Business.Dto;
using Caching.Business.Service.Interface;
using Microsoft.AspNetCore.Mvc;

namespace Caching.Core.Controllers.Api;

[ApiController]
[Route("api/level4")]
public class DistributedCacheController(
    ITwoServerService twoServerService,
    IDistributedProductService distributedProductService,
    ISerializationService serializationService,
    IHybridProductService hybridProductService) : ControllerBase
{
    private static readonly string[] Servers = ["A", "B"];

    [HttpGet("two-servers/{server}/products/{id:int}")]
    public async Task<IActionResult> ReadFromServer(string server, int id, bool distributed)
    {
        server = server.ToUpper();
        if (!Servers.Contains(server)) return BadRequest("Server must be A or B");
        return Ok(await twoServerService.ReadAsync(server, distributed, id));
    }

    [HttpPut("two-servers/{server}/products/{id:int}/price")]
    public async Task<IActionResult> UpdateFromServer(string server, int id, bool distributed, PriceUpdateDto dto)
    {
        server = server.ToUpper();
        if (!Servers.Contains(server)) return BadRequest("Server must be A or B");
        return Ok(await twoServerService.UpdatePriceAsync(server, distributed, id, dto.Price));
    }

    [HttpDelete("two-servers/products/{id:int}")]
    public async Task<IActionResult> ResetServers(int id)
    {
        await twoServerService.ResetAsync(id);
        return NoContent();
    }

    [HttpGet("distributed/products/{id:int}")]
    public async Task<IActionResult> GetDistributed(int id) => Ok(await distributedProductService.GetAsync(id));

    [HttpDelete("distributed/products/{id:int}")]
    public async Task<IActionResult> RemoveDistributed(int id)
    {
        await distributedProductService.RemoveAsync(id);
        return NoContent();
    }

    [HttpPost("distributed/products/{id:int}/refresh")]
    public async Task<IActionResult> RefreshDistributed(int id)
    {
        await distributedProductService.RefreshAsync(id);
        return NoContent();
    }

    [HttpGet("distributed/products/{id:int}/inspect")]
    public async Task<IActionResult> InspectDistributed(int id) => Ok(await distributedProductService.InspectAsync(id));

    [HttpGet("serialization")]
    public IActionResult CompareSerialization(int count = 100) => Ok(serializationService.Compare(Math.Clamp(count, 1, 10000)));

    [HttpGet("hybrid/products/{id:int}")]
    public async Task<IActionResult> GetHybrid(int id, bool skipLocal) => Ok(await hybridProductService.GetAsync(id, skipLocal));

    [HttpGet("hybrid/products/{id:int}/parallel")]
    public async Task<IActionResult> GetHybridParallel(int id, int requests = 10) =>
        Ok(await hybridProductService.GetParallelAsync(id, Math.Clamp(requests, 1, 50)));

    [HttpDelete("hybrid/products/{id:int}")]
    public async Task<IActionResult> RemoveHybrid(int id)
    {
        await hybridProductService.RemoveAsync(id);
        return NoContent();
    }

    [HttpDelete("hybrid/tags/{tag}")]
    public async Task<IActionResult> RemoveHybridTag(string tag)
    {
        await hybridProductService.RemoveByTagAsync(tag);
        return NoContent();
    }
}
