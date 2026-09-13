import koffi from "koffi";

import { ENetPacketFlag } from "./enums.js";
import {
  enetPacket,
  enet_packet_create,
  enet_packet_destroy,
} from "./native/index.js";
import type { NativePointer } from "./native/pointers.js";
import type { IENetPacket } from "./structs.js";
import { nativePointer } from "./structs.js";
import type { HandlePrototype } from "./util.js";
import { createHandle, readNumber } from "./util.js";

const DATA_OFFSET = koffi.offsetof(enetPacket, "data");
const DATA_LENGTH_OFFSET = koffi.offsetof(enetPacket, "dataLength");
const FLAGS_OFFSET = koffi.offsetof(enetPacket, "flags");
const REFERENCE_COUNT_OFFSET = koffi.offsetof(enetPacket, "referenceCount");

const packetPrototype: HandlePrototype<IENetPacket> = {
  get data(): Buffer {
    const pointer = this[nativePointer];
    const data: unknown = koffi.decode(pointer, DATA_OFFSET, "void *");
    const length = readNumber(pointer, DATA_LENGTH_OFFSET, "size_t");

    return Buffer.from(koffi.view(data, length));
  },
  get dataLength(): number {
    return readNumber(this[nativePointer], DATA_LENGTH_OFFSET, "size_t");
  },
  get flags(): number {
    return readNumber(this[nativePointer], FLAGS_OFFSET, "uint32");
  },
  get referenceCount(): number {
    return readNumber(this[nativePointer], REFERENCE_COUNT_OFFSET, "size_t");
  },
};

const wrapPacket = (pointer: NativePointer<"ENetPacket">): IENetPacket =>
  createHandle<IENetPacket>(packetPrototype, pointer);

const create = (
  data: Buffer,
  flags: number = ENetPacketFlag.none,
): IENetPacket | null => {
  const pointer = enet_packet_create(data, data.length, flags);

  return pointer === null ? null : wrapPacket(pointer);
};

const destroy = (packet: IENetPacket): void => {
  enet_packet_destroy(packet[nativePointer]);
};

export { create, destroy, wrapPacket };
