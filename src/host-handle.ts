import koffi from "koffi";

import { readAddress } from "./address.js";
import { enetHost, enetPeer } from "./native/index.js";
import type { NativePointer } from "./native/pointers.js";
import { peerOf } from "./peer.js";
import type { IENetAddress, IENetHost, IENetPeer } from "./structs.js";
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

const PEER_SIZE = koffi.sizeof(enetPeer);
const ADDRESS_OFFSET = koffi.offsetof(enetHost, "address");
const CHANNEL_LIMIT_OFFSET = koffi.offsetof(enetHost, "channelLimit");
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

const hostPrototype: HandlePrototype<IENetHost> = {
  get address(): IENetAddress {
    return readAddress(this[nativePointer], ADDRESS_OFFSET);
  },
  get channelLimit(): number {
    return readNumber(this[nativePointer], CHANNEL_LIMIT_OFFSET, "size_t");
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

export { wrapHost };
