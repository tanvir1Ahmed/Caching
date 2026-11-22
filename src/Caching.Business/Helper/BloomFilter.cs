using System.Collections;

namespace Caching.Business.Helper;

public class BloomFilter(int sizeInBits, int hashFunctions)
{
    private readonly BitArray bits = new(sizeInBits);

    public int SizeInBits => sizeInBits;
    public int HashFunctions => hashFunctions;
    public int ItemsAdded { get; private set; }

    public int BitsSet
    {
        get
        {
            var count = 0;
            for (var i = 0; i < bits.Length; i++) if (bits[i]) count++;
            return count;
        }
    }

    public double EstimatedFalsePositiveRate =>
        Math.Pow(1 - Math.Exp(-hashFunctions * (double)ItemsAdded / sizeInBits), hashFunctions);

    public void Add(string item)
    {
        foreach (var position in Positions(item)) bits[position] = true;
        ItemsAdded++;
    }

    public bool MightContain(string item) => Positions(item).All(position => bits[position]);

    public string ToBitString()
    {
        var chars = new char[bits.Length];
        for (var i = 0; i < bits.Length; i++) chars[i] = bits[i] ? '1' : '0';
        return new string(chars);
    }

    public IEnumerable<int> Positions(string item)
    {
        var first = Fnv1a(item, 2166136261);
        var second = Fnv1a(item, 16777619) | 1;
        for (var i = 0; i < hashFunctions; i++)
        {
            yield return (int)((first + (uint)i * second) % (uint)sizeInBits);
        }
    }

    private static uint Fnv1a(string text, uint seed)
    {
        var hash = seed;
        foreach (var c in text)
        {
            hash ^= c;
            hash *= 16777619;
        }
        return hash;
    }
}
