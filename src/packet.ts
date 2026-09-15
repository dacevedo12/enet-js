import koffi from "koffi";

import { toNativeBuffers } from "./buffers.js";
import { afterCallbacks, guardVoidCallback } from "./callbacks.js";
import { ENetPacketFlag } from "./enums.js";
import {
  enetPacket,
  enetPacketFreeCallback,
  enet_crc32,
  enet_packet_create,
  enet_packet_destroy,
  enet_packet_resize,
} from "./native/index.js";
import type { NativePointer } from "./native/pointers.js";
import type { ENetPacketFreeCallback, IENetPacket } from "./structs.js";
import { nativePointer } from "./structs.js";
import type { HandlePrototype } from "./util.js";
import { createHandle, nonNull, readNumber, readPointer } from "./util.js";

interface FreeCallback {
  readonly handler: ENetPacketFreeCallback;
  readonly packet: IENetPacket;
}

const DATA_OFFSET = koffi.offsetof(enetPacket, "data");
const DATA_LENGTH_OFFSET = koffi.offsetof(enetPacket, "dataLength");
const FLAGS_OFFSET = koffi.offsetof(enetPacket, "flags");
const FREE_CALLBACK_OFFSET = koffi.offsetof(enetPacket, "freeCallback");
const REFERENCE_COUNT_OFFSET = koffi.offsetof(enetPacket, "referenceCount");

// JS free callbacks by packet pointer, so each callback gets the packet's handle back
const freeCallbacks = new Map<bigint, FreeCallback>();

// One registered callback serves every packet, since ENet passes the packet it frees
const freeCallbackAddress = koffi.register((pointer: bigint): void => {
  guardVoidCallback(() => {
    const { handler, packet } = nonNull(
      freeCallbacks.get(pointer),
      "ENet freed a packet without a JS free callback",
    );

    freeCallbacks.delete(pointer);
    handler(packet);
  });
}, enetPacketFreeCallback);

const packetPrototype: HandlePrototype<IENetPacket> = {
  get data(): Buffer {
    const pointer = this[nativePointer];
    const length = readNumber(pointer, DATA_LENGTH_OFFSET, "size_t");

    return Buffer.from(koffi.view(readPointer(pointer, DATA_OFFSET), length));
  },
  get dataLength(): number {
    return readNumber(this[nativePointer], DATA_LENGTH_OFFSET, "size_t");
  },
  get flags(): number {
    return readNumber(this[nativePointer], FLAGS_OFFSET, "uint32");
  },
  get freeCallback(): ENetPacketFreeCallback | null {
    return freeCallbacks.get(this[nativePointer])?.handler ?? null;
  },
  set freeCallback(handler: ENetPacketFreeCallback | null) {
    const pointer = this[nativePointer];

    if (handler === null) {
      freeCallbacks.delete(pointer);
    } else {
      freeCallbacks.set(pointer, { handler, packet: this });
    }

    koffi.encode(
      pointer,
      FREE_CALLBACK_OFFSET,
      "void *",
      handler === null ? null : freeCallbackAddress,
    );
  },
  get referenceCount(): number {
    return readNumber(this[nativePointer], REFERENCE_COUNT_OFFSET, "size_t");
  },
};

const wrapPacket = (pointer: NativePointer<"ENetPacket">): IENetPacket =>
  createHandle<IENetPacket>(packetPrototype, pointer, {});

const create = (
  data: Buffer,
  flags: number = ENetPacketFlag.none,
): IENetPacket | null => {
  const pointer = afterCallbacks(() =>
    enet_packet_create(data, data.length, flags),
  );

  return pointer === null ? null : wrapPacket(pointer);
};

const destroy = (packet: IENetPacket): void => {
  afterCallbacks(() => {
    enet_packet_destroy(packet[nativePointer]);
  });
};

const resize = (packet: IENetPacket, dataLength: number): number =>
  afterCallbacks(() => enet_packet_resize(packet[nativePointer], dataLength));

const crc32 = (buffers: readonly Buffer[]): number =>
  enet_crc32(toNativeBuffers(buffers), buffers.length);

export { crc32, create, destroy, resize, wrapPacket };
