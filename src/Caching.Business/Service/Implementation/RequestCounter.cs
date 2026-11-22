using System.Collections.Concurrent;
using Caching.Business.Service.Interface;

namespace Caching.Business.Service.Implementation;

public class RequestCounter : IRequestCounter
{
    private readonly ConcurrentDictionary<string, long> counters = new();

    public long Increment(string scope) => counters.AddOrUpdate(scope, 1, (_, value) => value + 1);

    public IDictionary<string, long> GetAll() => new Dictionary<string, long>(counters);

    public void Reset() => counters.Clear();
}
