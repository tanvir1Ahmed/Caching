using Caching.Business.Dto;

namespace Caching.Business.Service.Interface;

public interface ISerializationService
{
    List<SerializationResultDto> Compare(int productCount);
}
