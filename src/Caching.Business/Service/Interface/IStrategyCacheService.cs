namespace Caching.Business.Service.Interface;

public interface IStrategyCacheService
{
    void Remove(string strategy, int id);
}
