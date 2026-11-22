namespace Caching.Business.Service.Interface;

public interface IRequestCounter
{
    long Increment(string scope);
    IDictionary<string, long> GetAll();
    void Reset();
}
