import type { KoffiFunc } from "koffi";

import type { NativeBuffer } from "./library.js";
import { lib } from "./library.js";
import type { NativePointer } from "./pointers.js";

const enet_packet_create: KoffiFunc<
  (
    data: Buffer,
    dataLength: number,
    flags: number,
  ) => NativePointer<"ENetPacket"> | null
> = lib.func(
  "ENetPacket *enet_packet_create(void *data, size_t dataLength, uint32 flags)",
);
const enet_packet_destroy: KoffiFunc<
  (packet: NativePointer<"ENetPacket">) => undefined
> = lib.func("void enet_packet_destroy(ENetPacket *packet)");
const enet_packet_resize: KoffiFunc<
  (packet: NativePointer<"ENetPacket">, dataLength: number) => number
> = lib.func("int enet_packet_resize(ENetPacket *packet, size_t dataLength)");
// Declared extern rather than ENET_API in 1.2.5, but its ChangeLog tells users to set host->checksum to it
const enet_crc32: KoffiFunc<
  (buffers: readonly NativeBuffer[], bufferCount: number) => number
> = lib.func(
  "uint32 enet_crc32(const ENetBuffer *buffers, size_t bufferCount)",
);

// The address of enet_crc32, stored in ENetHost.checksum without a JS callback
const crc32Address: unknown = lib.symbol("enet_crc32");

export {
  crc32Address,
  enet_crc32,
  enet_packet_create,
  enet_packet_destroy,
  enet_packet_resize,
};
