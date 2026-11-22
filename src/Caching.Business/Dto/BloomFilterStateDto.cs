namespace Caching.Business.Dto;

public class BloomFilterStateDto
{
    public int SizeInBits { get; set; }
    public int HashFunctions { get; set; }
    public int ItemsAdded { get; set; }
    public int BitsSet { get; set; }
    public double EstimatedFalsePositiveRate { get; set; }
    public string Checked { get; set; } = string.Empty;
    public List<int> CheckedPositions { get; set; } = [];
    public bool? MightContain { get; set; }
    public bool? ActuallyExists { get; set; }
    public string Bits { get; set; } = string.Empty;
}
