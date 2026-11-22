namespace Caching.Infrastructure.Exceptions;

public class CacheUnavailableException(string message, Exception? innerException = null) : Exception(message, innerException);
