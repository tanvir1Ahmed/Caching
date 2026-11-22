using Caching.Business.Constant;
using Caching.Business.Dto;
using Caching.Business.Service.Interface;
using Microsoft.AspNetCore.Mvc;

namespace Caching.Core.Controllers.Api;

[ApiController]
[Route("api/level3")]
public class StrategyController(
    ICacheAsideService cacheAsideService,
    IReadThroughCache<ProductDto> readThroughCache,
    IWriteStrategyService writeStrategyService,
    IWriteBehindService writeBehindService,
    IRefreshAheadService refreshAheadService,
    IStrategyCacheService strategyCacheService) : ControllerBase
{
    [HttpGet("cache-aside/products/{id:int}")]
    public async Task<IActionResult> GetCacheAside(int id) => Ok(await cacheAsideService.GetAsync(id));

    [HttpGet("read-through/products/{id:int}")]
    public async Task<IActionResult> GetReadThrough(int id) => Ok(await readThroughCache.GetAsync(id));

    [HttpGet("write-through/products/{id:int}")]
    public async Task<IActionResult> GetWriteThrough(int id) => Ok(await writeStrategyService.GetAsync(Strategy.WriteThrough, id));

    [HttpPut("write-through/products/{id:int}/price")]
    public async Task<IActionResult> WriteThrough(int id, PriceUpdateDto dto) => Ok(await writeStrategyService.WriteThroughAsync(id, dto.Price));

    [HttpGet("write-around/products/{id:int}")]
    public async Task<IActionResult> GetWriteAround(int id) => Ok(await writeStrategyService.GetAsync(Strategy.WriteAround, id));

    [HttpPut("write-around/products/{id:int}/price")]
    public async Task<IActionResult> WriteAround(int id, PriceUpdateDto dto) => Ok(await writeStrategyService.WriteAroundAsync(id, dto.Price));

    [HttpGet("write-behind/products/{id:int}")]
    public async Task<IActionResult> GetWriteBehind(int id) => Ok(await writeBehindService.GetAsync(id));

    [HttpPut("write-behind/products/{id:int}/price")]
    public async Task<IActionResult> WriteBehind(int id, PriceUpdateDto dto) => Ok(await writeBehindService.UpdatePriceAsync(id, dto.Price));

    [HttpGet("write-behind/state")]
    public IActionResult GetWriteBehindState() => Ok(writeBehindService.GetState());

    [HttpPost("write-behind/flush")]
    public async Task<IActionResult> FlushWriteBehind() => Ok(new { written = await writeBehindService.FlushAsync() });

    [HttpGet("refresh-ahead/products/{id:int}")]
    public async Task<IActionResult> GetRefreshAhead(int id) => Ok(await refreshAheadService.GetAsync(id));

    [HttpDelete("{strategy}/products/{id:int}")]
    public IActionResult Remove(string strategy, int id)
    {
        strategyCacheService.Remove(strategy, id);
        return NoContent();
    }
}
