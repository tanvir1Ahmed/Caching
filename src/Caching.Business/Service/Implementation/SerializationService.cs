using System.Diagnostics;
using System.IO.Compression;
using System.Text;
using System.Text.Json;
using Caching.Business.Dto;
using Caching.Business.Service.Interface;

namespace Caching.Business.Service.Implementation;

public class SerializationService : ISerializationService
{
    private const int Iterations = 50;
    private static readonly string[] Names = ["Laptop", "Mouse", "Keyboard", "Monitor", "Headphones", "Webcam", "Microphone", "Desk Lamp", "USB Hub", "External SSD"];

    public List<SerializationResultDto> Compare(int productCount)
    {
        var products = Enumerable.Range(1, productCount).Select(i => new ProductDto
        {
            Id = i,
            Name = $"{Names[i % Names.Length]} model {i}",
            Price = 10 + i % 500,
            UpdatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc).AddMinutes(i)
        }).ToList();

        var indented = new JsonSerializerOptions { WriteIndented = true };
        var results = new List<SerializationResultDto>
        {
            Measure("JSON (indented)", () => JsonSerializer.SerializeToUtf8Bytes(products, indented), bytes => JsonSerializer.Deserialize<List<ProductDto>>(bytes)),
            Measure("JSON (compact)", () => JsonSerializer.SerializeToUtf8Bytes(products), bytes => JsonSerializer.Deserialize<List<ProductDto>>(bytes)),
            Measure("JSON + GZip", () => Compress(JsonSerializer.SerializeToUtf8Bytes(products), s => new GZipStream(s, CompressionLevel.Fastest)),
                bytes => JsonSerializer.Deserialize<List<ProductDto>>(Decompress(bytes, s => new GZipStream(s, CompressionMode.Decompress)))),
            Measure("JSON + Brotli", () => Compress(JsonSerializer.SerializeToUtf8Bytes(products), s => new BrotliStream(s, CompressionLevel.Fastest)),
                bytes => JsonSerializer.Deserialize<List<ProductDto>>(Decompress(bytes, s => new BrotliStream(s, CompressionMode.Decompress)))),
            Measure("Custom text (id|name|price)", () => Encoding.UTF8.GetBytes(string.Join('\n', products.Select(p => $"{p.Id}|{p.Name}|{p.Price}"))),
                bytes => Encoding.UTF8.GetString(bytes).Split('\n').Select(l => l.Split('|')).ToList())
        };

        var jsonBytes = results[1].Bytes;
        foreach (var result in results) result.PercentOfJson = Math.Round(result.Bytes * 100.0 / jsonBytes, 1);
        return results;
    }

    private static SerializationResultDto Measure(string format, Func<byte[]> serialize, Func<byte[], object?> deserialize)
    {
        var bytes = serialize();
        var stopwatch = Stopwatch.StartNew();
        for (var i = 0; i < Iterations; i++) serialize();
        var serializeMs = stopwatch.Elapsed.TotalMilliseconds / Iterations;

        stopwatch.Restart();
        for (var i = 0; i < Iterations; i++) deserialize(bytes);
        var deserializeMs = stopwatch.Elapsed.TotalMilliseconds / Iterations;

        return new SerializationResultDto
        {
            Format = format,
            Bytes = bytes.Length,
            SerializeMs = Math.Round(serializeMs, 4),
            DeserializeMs = Math.Round(deserializeMs, 4)
        };
    }

    private static byte[] Compress(byte[] data, Func<Stream, Stream> createStream)
    {
        using var output = new MemoryStream();
        using (var compressor = createStream(output)) compressor.Write(data);
        return output.ToArray();
    }

    private static byte[] Decompress(byte[] data, Func<Stream, Stream> createStream)
    {
        using var input = new MemoryStream(data);
        using var decompressor = createStream(input);
        using var output = new MemoryStream();
        decompressor.CopyTo(output);
        return output.ToArray();
    }
}
