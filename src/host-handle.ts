import koffi from "koffi";

import { readAddress } from "./address.js";
import { fromNativeBuffers, viewOf } from "./buffers.js";
import { guardCallback } from "./callbacks.js";
import {
  crc32Address,
  enetChecksumCallback,
  enetHost,
  enetInterceptCallback,
  enetPeer,
} from "./native/index.js";
import type { NativePointer } from "./native/pointers.js";
import { crc32 } from "./packet.js";
import { peerOf } from "./peer.js";
import type {
  ENetChecksumCallback,
  ENetInterceptCallback,
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

interface JsIntercept {
  readonly handler: ENetInterceptCallback;
  readonly host: IENetHost;
}

const CHECKSUM_FAILURE = 0;
const INTERCEPT_FAILURE = -1;
const PEER_SIZE = koffi.sizeof(enetPeer);
const ADDRESS_OFFSET = koffi.offsetof(enetHost, "address");
const CHANNEL_LIMIT_OFFSET = koffi.offsetof(enetHost, "channelLimit");
const CHECKSUM_OFFSET = koffi.offsetof(enetHost, "checksum");
const DUPLICATE_PEERS_OFFSET = koffi.offsetof(enetHost, "duplicatePeers");
const INCOMING_BANDWIDTH_OFFSET = koffi.offsetof(enetHost, "incomingBandwidth");
const INTERCEPT_OFFSET = koffi.offsetof(enetHost, "intercept");
const MAXIMUM_PACKET_SIZE_OFFSET = koffi.offsetof(
  enetHost,
  "maximumPacketSize",
);
const MAXIMUM_WAITING_DATA_OFFSET = koffi.offsetof(
  enetHost,
  "maximumWaitingData",
);
const OUTGOING_BANDWIDTH_OFFSET = koffi.offsetof(enetHost, "outgoingBandwidth");
const PEER_COUNT_OFFSET = koffi.offsetof(enetHost, "peerCount");
const PEERS_OFFSET = koffi.offsetof(enetHost, "peers");
const RECEIVED_ADDRESS_OFFSET = koffi.offsetof(enetHost, "receivedAddress");
const RECEIVED_DATA_OFFSET = koffi.offsetof(enetHost, "receivedData");
const RECEIVED_DATA_LENGTH_OFFSET = koffi.offsetof(
  enetHost,
  "receivedDataLength",
);
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

// JS intercepts by host pointer
const intercepts = new Map<bigint, JsIntercept>();

// One registered callback serves every host, since ENet passes the host to it; the datagram, which C reads from undocumented host fields, comes as arguments
const interceptAddress = koffi.register(
  (host: bigint): number =>
    guardCallback(INTERCEPT_FAILURE, () => {
      const intercept = nonNull(
        intercepts.get(host),
        "ENet intercepted a datagram for a host without a JS intercept",
      );
      const data = viewOf(
        readPointer(host, RECEIVED_DATA_OFFSET),
        readNumber(host, RECEIVED_DATA_LENGTH_OFFSET, "size_t"),
      );
      return intercept.handler(
        intercept.host,
        data,
        readAddress(host, RECEIVED_ADDRESS_OFFSET),
      );
    }),
  enetInterceptCallback,
);

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
    // ENet must stop pointing at the old callback before its Koffi slot is freed, since Koffi reuses freed slots
    unregisterChecksum(previous);
  },
  get duplicatePeers(): number {
    return readNumber(this[nativePointer], DUPLICATE_PEERS_OFFSET, "size_t");
  },
  set duplicatePeers(value: number) {
    writeNumber(this[nativePointer], DUPLICATE_PEERS_OFFSET, "size_t", value);
  },
  get incomingBandwidth(): number {
    return readNumber(this[nativePointer], INCOMING_BANDWIDTH_OFFSET, "uint32");
  },
  get intercept(): ENetInterceptCallback | null {
    return intercepts.get(this[nativePointer])?.handler ?? null;
  },
  set intercept(handler: ENetInterceptCallback | null) {
    const pointer = this[nativePointer];

    if (handler === null) {
      intercepts.delete(pointer);
    } else {
      intercepts.set(pointer, { handler, host: this });
    }

    koffi.encode(
      pointer,
      INTERCEPT_OFFSET,
      "void *",
      handler === null ? null : interceptAddress,
    );
  },
  get maximumPacketSize(): number {
    return readNumber(
      this[nativePointer],
      MAXIMUM_PACKET_SIZE_OFFSET,
      "size_t",
    );
  },
  set maximumPacketSize(value: number) {
    writeNumber(
      this[nativePointer],
      MAXIMUM_PACKET_SIZE_OFFSET,
      "size_t",
      value,
    );
  },
  get maximumWaitingData(): number {
    return readNumber(
      this[nativePointer],
      MAXIMUM_WAITING_DATA_OFFSET,
      "size_t",
    );
  },
  set maximumWaitingData(value: number) {
    writeNumber(
      this[nativePointer],
      MAXIMUM_WAITING_DATA_OFFSET,
      "size_t",
      value,
    );
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

// Drops the JS callbacks of a destroyed host
const forgetHost = (host: bigint): void => {
  const checksum = checksums.get(host);

  checksums.delete(host);
  intercepts.delete(host);
  unregisterChecksum(checksum);
};

export { forgetHost, wrapHost };
