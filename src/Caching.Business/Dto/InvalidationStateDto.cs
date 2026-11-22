namespace Caching.Business.Dto;

public class InvalidationStateDto
{
    public Dictionary<int, int> Versions { get; set; } = [];
    public int GroupGeneration { get; set; }
}
