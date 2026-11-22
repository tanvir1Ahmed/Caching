using Caching.Business.Dto;

namespace Caching.Business.Service.Interface;

public interface IMetricsService
{
    Task<MetricsDashboardDto> GetAsync();
}
