import type { TypeObject } from "koffi";
import koffi from "koffi";

// Parameters that point to ENet structs are plain pointers, read through handles
const enetPacketFreeCallback: TypeObject = koffi.pointer(
  koffi.proto("void ENetPacketFreeCallback(void *packet)"),
);
const enetChecksumCallback: TypeObject = koffi.pointer(
  koffi.proto("uint32 ENetChecksumCallback(void *buffers, size_t bufferCount)"),
);
const enetInterceptCallback: TypeObject = koffi.pointer(
  koffi.proto("int ENetInterceptCallback(void *host, void *event)"),
);
const enetCompressCallback: TypeObject = koffi.pointer(
  koffi.proto(
    "size_t ENetCompressCallback(void *context, void *inBuffers, size_t inBufferCount, size_t inLimit, void *outData, size_t outLimit)",
  ),
);
const enetDecompressCallback: TypeObject = koffi.pointer(
  koffi.proto(
    "size_t ENetDecompressCallback(void *context, void *inData, size_t inLimit, void *outData, size_t outLimit)",
  ),
);
const enetCompressorDestroyCallback: TypeObject = koffi.pointer(
  koffi.proto("void ENetCompressorDestroyCallback(void *context)"),
);
const enetNoMemoryCallback: TypeObject = koffi.pointer(
  koffi.proto("void ENetNoMemoryCallback()"),
);

export {
  enetChecksumCallback,
  enetCompressCallback,
  enetCompressorDestroyCallback,
  enetDecompressCallback,
  enetInterceptCallback,
  enetNoMemoryCallback,
  enetPacketFreeCallback,
};
