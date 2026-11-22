namespace Caching.Business.Constant;

public static class Strategy
{
    public const string CacheAside = "cache-aside";
    public const string ReadThrough = "read-through";
    public const string WriteThrough = "write-through";
    public const string WriteAround = "write-around";
    public const string WriteBehind = "write-behind";
    public const string RefreshAhead = "refresh-ahead";
}
