import type { TypeObject } from "koffi";
import koffi from "koffi";

// Parameters that point to ENet structs are plain pointers, read through handles
const enetPacketFreeCallback: TypeObject = koffi.pointer(
  koffi.proto("void ENetPacketFreeCallback(void *packet)"),
);
const enetChecksumCallback: TypeObject = koffi.pointer(
  koffi.proto("uint32 ENetChecksumCallback(void *buffers, size_t bufferCount)"),
);
const enetNoMemoryCallback: TypeObject = koffi.pointer(
  koffi.proto("void ENetNoMemoryCallback()"),
);
const enetRandCallback: TypeObject = koffi.pointer(
  koffi.proto("int ENetRandCallback()"),
);

export {
  enetChecksumCallback,
  enetNoMemoryCallback,
  enetPacketFreeCallback,
  enetRandCallback,
};
