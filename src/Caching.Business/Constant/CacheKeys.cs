namespace Caching.Business.Constant;

public static class CacheKeys
{
    public static string Product(int id) => $"level1:product:{id}";
    public static string Expiration(ExpirationType type, int id) => $"level1:expiration:{type.ToString().ToLower()}:product:{id}";
    public static string Eviction(string key) => $"level1:eviction:{key}";
}
