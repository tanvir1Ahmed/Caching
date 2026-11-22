using Caching.Business.Dto;

namespace Caching.Business.Service.Interface;

public interface IPenetrationService
{
    Task<LoadTestResultDto> RunAsync(string mode, string pattern, int requests);
    Task<BloomFilterStateDto> GetBloomStateAsync(string? check);
}
