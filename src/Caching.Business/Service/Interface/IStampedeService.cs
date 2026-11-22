using Caching.Business.Dto;

namespace Caching.Business.Service.Interface;

public interface IStampedeService
{
    Task<LoadTestResultDto> RunAsync(string mode, int id, int requests);
}
