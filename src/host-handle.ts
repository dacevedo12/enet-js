import koffi from "koffi";

import { readAddress } from "./address.js";
import { fromNativeBuffers } from "./buffers.js";
import { guardCallback } from "./callbacks.js";
import {
  crc32Address,
  enetChecksumCallback,
  enetHost,
  enetPeer,
} from "./native/index.js";
import type { NativePointer } from "./native/pointers.js";
import { crc32 } from "./packet.js";
import { peerOf } from "./peer.js";
import type {
  ENetChecksumCallback,
  IENetAddress,
  IENetHost,
  IENetPeer,
} from "./structs.js";
import { nativePointer } from "./structs.js";
import type { HandlePrototype } from "./util.js";
import {
  createHandle,
  elementPointer,
  nonNull,
  readNumber,
  readPointer,
  writeNumber,
} from "./util.js";

interface JsChecksum {
  readonly address: bigint;
  readonly handler: ENetChecksumCallback;
}

const CHECKSUM_FAILURE = 0;
const PEER_SIZE = koffi.sizeof(enetPeer);
const ADDRESS_OFFSET = koffi.offsetof(enetHost, "address");
const CHANNEL_LIMIT_OFFSET = koffi.offsetof(enetHost, "channelLimit");
const CHECKSUM_OFFSET = koffi.offsetof(enetHost, "checksum");
const INCOMING_BANDWIDTH_OFFSET = koffi.offsetof(enetHost, "incomingBandwidth");
const OUTGOING_BANDWIDTH_OFFSET = koffi.offsetof(enetHost, "outgoingBandwidth");
const PEER_COUNT_OFFSET = koffi.offsetof(enetHost, "peerCount");
const PEERS_OFFSET = koffi.offsetof(enetHost, "peers");
const TOTAL_RECEIVED_DATA_OFFSET = koffi.offsetof(
  enetHost,
  "totalReceivedData",
);
const TOTAL_RECEIVED_PACKETS_OFFSET = koffi.offsetof(
  enetHost,
  "totalReceivedPackets",
);
const TOTAL_SENT_DATA_OFFSET = koffi.offsetof(enetHost, "totalSentData");
const TOTAL_SENT_PACKETS_OFFSET = koffi.offsetof(enetHost, "totalSentPackets");

// JS checksums by host pointer; ENet passes no host to a checksum, so each gets its own registered callback
const checksums = new Map<bigint, JsChecksum>();

// ENet's own enet_crc32 goes into the field as is, with no JS in the way
const checksumAddress = (
  host: bigint,
  handler: ENetChecksumCallback | null,
): unknown => {
  if (handler === null || handler === crc32) {
    return handler === null ? null : crc32Address;
  }

  const address = koffi.register(
    (buffers: bigint, bufferCount: number): number =>
      guardCallback(CHECKSUM_FAILURE, () =>
        handler(fromNativeBuffers(buffers, bufferCount)),
      ),
    enetChecksumCallback,
  );

  checksums.set(host, { address, handler });

  return address;
};

const unregisterChecksum = (checksum: JsChecksum | undefined): void => {
  if (checksum !== undefined) {
    koffi.unregister(checksum.address);
  }
};

const hostPrototype: HandlePrototype<IENetHost> = {
  get address(): IENetAddress {
    return readAddress(this[nativePointer], ADDRESS_OFFSET);
  },
  get channelLimit(): number {
    return readNumber(this[nativePointer], CHANNEL_LIMIT_OFFSET, "size_t");
  },
  get checksum(): ENetChecksumCallback | null {
    const pointer = this[nativePointer];

    return readPointer(pointer, CHECKSUM_OFFSET) === crc32Address
      ? crc32
      : (checksums.get(pointer)?.handler ?? null);
  },
  set checksum(handler: ENetChecksumCallback | null) {
    const pointer = this[nativePointer];
    const previous = checksums.get(pointer);

    checksums.delete(pointer);
    koffi.encode(
      pointer,
      CHECKSUM_OFFSET,
      "void *",
      checksumAddress(pointer, handler),
    );
    unregisterChecksum(previous);
  },
  get incomingBandwidth(): number {
    return readNumber(this[nativePointer], INCOMING_BANDWIDTH_OFFSET, "uint32");
  },
  get outgoingBandwidth(): number {
    return readNumber(this[nativePointer], OUTGOING_BANDWIDTH_OFFSET, "uint32");
  },
  get peerCount(): number {
    return readNumber(this[nativePointer], PEER_COUNT_OFFSET, "size_t");
  },
  get peers(): readonly IENetPeer[] {
    const pointer = this[nativePointer];
    const peers = nonNull(
      readPointer(pointer, PEERS_OFFSET),
      "The host has no peers",
    );

    return Array.from({ length: this.peerCount }, (_peer, index) =>
      peerOf(pointer, elementPointer<"ENetPeer">(peers, index, PEER_SIZE)),
    );
  },
  get totalReceivedData(): number {
    return readNumber(
      this[nativePointer],
      TOTAL_RECEIVED_DATA_OFFSET,
      "uint32",
    );
  },
  set totalReceivedData(value: number) {
    writeNumber(
      this[nativePointer],
      TOTAL_RECEIVED_DATA_OFFSET,
      "uint32",
      value,
    );
  },
  get totalReceivedPackets(): number {
    return readNumber(
      this[nativePointer],
      TOTAL_RECEIVED_PACKETS_OFFSET,
      "uint32",
    );
  },
  set totalReceivedPackets(value: number) {
    writeNumber(
      this[nativePointer],
      TOTAL_RECEIVED_PACKETS_OFFSET,
      "uint32",
      value,
    );
  },
  get totalSentData(): number {
    return readNumber(this[nativePointer], TOTAL_SENT_DATA_OFFSET, "uint32");
  },
  set totalSentData(value: number) {
    writeNumber(this[nativePointer], TOTAL_SENT_DATA_OFFSET, "uint32", value);
  },
  get totalSentPackets(): number {
    return readNumber(this[nativePointer], TOTAL_SENT_PACKETS_OFFSET, "uint32");
  },
  set totalSentPackets(value: number) {
    writeNumber(
      this[nativePointer],
      TOTAL_SENT_PACKETS_OFFSET,
      "uint32",
      value,
    );
  },
};

const wrapHost = (pointer: NativePointer<"ENetHost">): IENetHost =>
  createHandle<IENetHost>(hostPrototype, pointer, {});

// Drops the JS checksum of a destroyed host
const forgetHost = (host: bigint): void => {
  const checksum = checksums.get(host);

  checksums.delete(host);
  unregisterChecksum(checksum);
};

export { forgetHost, wrapHost };
