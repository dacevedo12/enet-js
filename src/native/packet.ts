import type { KoffiFunc } from "koffi";

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

export { enet_packet_create, enet_packet_destroy, enet_packet_resize };
