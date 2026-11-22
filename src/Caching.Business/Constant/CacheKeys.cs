namespace Caching.Business.Constant;

public static class CacheKeys
{
    public static string Product(int id) => $"level1:product:{id}";
    public static string Expiration(ExpirationType type, int id) => $"level1:expiration:{type.ToString().ToLower()}:product:{id}";
    public static string Eviction(string key) => $"level1:eviction:{key}";
    public static string Http(string scope, int id) => $"level2:{scope.ToLower()}:product:{id}";
    public static string Strategy(string strategy, int id) => $"level3:{strategy}:product:{id}";
}
