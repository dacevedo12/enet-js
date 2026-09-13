/* oxlint-disable sort-keys -- struct members must follow the C declaration order */
import type { TypeObject } from "koffi";
import koffi from "koffi";

import type { ENetEventType } from "./enums.js";
import type { NativePointer } from "./pointers.js";

// ENET_PEER_RELIABLE_WINDOWS in enet.h
const ENET_PEER_RELIABLE_WINDOWS = 16;

// ENET_PEER_UNSEQUENCED_WINDOW_SIZE in enet.h, stored as 32-bit words
const ENET_PEER_UNSEQUENCED_WINDOW_SIZE = 1024;
const UNSEQUENCED_WINDOW_WORD_BITS = 32;

// ENET_PROTOCOL_MAXIMUM_PACKET_COMMANDS in protocol.h
const ENET_PROTOCOL_MAXIMUM_PACKET_COMMANDS = 32;

// ENET_BUFFER_MAXIMUM in enet.h: 1 + 2 * ENET_PROTOCOL_MAXIMUM_PACKET_COMMANDS
const ENET_BUFFER_MAXIMUM = 65;

// ENET_PROTOCOL_MAXIMUM_MTU in protocol.h, the size of each ENetHost.packetData buffer
const ENET_PROTOCOL_MAXIMUM_MTU = 4096;
const PACKET_DATA_BUFFERS = 2;

// The size of ENetProtocol, the packed union of every protocol command
const ENET_PROTOCOL_SIZE = 48;

interface NativeAddress {
  readonly host: number;
  readonly port: number;
}

interface NativeBuffer {
  readonly data: Buffer;
  readonly dataLength: number;
}

interface NativeCallbacks {
  readonly free: null;
  readonly malloc: null;
  readonly no_memory: bigint | null;
}

interface NativeCompressor {
  readonly compress: bigint;
  readonly context: bigint;
  readonly decompress: bigint;
  readonly destroy: bigint;
}

interface NativeEvent {
  readonly channelID: number;
  readonly data: number;
  readonly packet: NativePointer<"ENetPacket"> | null;
  readonly peer: NativePointer<"ENetPeer"> | null;
  readonly type: ENetEventType;
}

type Platforms<Value> = Readonly<Partial<Record<NodeJS.Platform, Value>>>;

const enetUint8: TypeObject = koffi.types.uint8;
const enetUint16: TypeObject = koffi.types.uint16;
const enetUint32: TypeObject = koffi.types.uint32;

// On Windows ENetSocket is SOCKET, a pointer-sized integer where INVALID_SOCKET reads as -1
const socketTypes: Platforms<string> = { win32: "intptr_t" };

const enetSocket: TypeObject = koffi.alias(
  "ENetSocket",
  socketTypes[process.platform] ?? "int",
);

// On Windows ENetBuffer is laid out like WSABUF, elsewhere like struct iovec
const bufferMembers: Platforms<Readonly<Record<string, TypeObject | string>>> =
  { win32: { dataLength: koffi.types.size_t, data: "void *" } };

const enetBuffer: TypeObject = koffi.struct(
  "ENetBuffer",
  bufferMembers[process.platform] ?? {
    data: "void *",
    dataLength: koffi.types.size_t,
  },
);

const enetAddress: TypeObject = koffi.struct("ENetAddress", {
  host: enetUint32,
  port: enetUint16,
});

const enetPacket: TypeObject = koffi.struct("ENetPacket", {
  referenceCount: koffi.types.size_t,
  flags: enetUint32,
  data: "uint8 *",
  dataLength: koffi.types.size_t,
  freeCallback: "void *",
  userData: "void *",
});

const enetListNode: TypeObject = koffi.struct("ENetListNode", {
  next: "ENetListNode *",
  previous: "ENetListNode *",
});

const enetList: TypeObject = koffi.struct("ENetList", {
  sentinel: enetListNode,
});

const enetChannel: TypeObject = koffi.struct("ENetChannel", {
  outgoingReliableSequenceNumber: enetUint16,
  outgoingUnreliableSequenceNumber: enetUint16,
  usedReliableWindows: enetUint16,
  reliableWindows: koffi.array(enetUint16, ENET_PEER_RELIABLE_WINDOWS),
  incomingReliableSequenceNumber: enetUint16,
  incomingUnreliableSequenceNumber: enetUint16,
  incomingReliableCommands: enetList,
  incomingUnreliableCommands: enetList,
});

const enetPeer: TypeObject = koffi.struct("ENetPeer", {
  dispatchList: enetListNode,
  host: "void *",
  outgoingPeerID: enetUint16,
  incomingPeerID: enetUint16,
  connectID: enetUint32,
  outgoingSessionID: enetUint8,
  incomingSessionID: enetUint8,
  address: enetAddress,
  data: "void *",
  state: koffi.types.int,
  channels: "ENetChannel *",
  channelCount: koffi.types.size_t,
  incomingBandwidth: enetUint32,
  outgoingBandwidth: enetUint32,
  incomingBandwidthThrottleEpoch: enetUint32,
  outgoingBandwidthThrottleEpoch: enetUint32,
  incomingDataTotal: enetUint32,
  outgoingDataTotal: enetUint32,
  lastSendTime: enetUint32,
  lastReceiveTime: enetUint32,
  nextTimeout: enetUint32,
  earliestTimeout: enetUint32,
  packetLossEpoch: enetUint32,
  packetsSent: enetUint32,
  packetsLost: enetUint32,
  packetLoss: enetUint32,
  packetLossVariance: enetUint32,
  packetThrottle: enetUint32,
  packetThrottleLimit: enetUint32,
  packetThrottleCounter: enetUint32,
  packetThrottleEpoch: enetUint32,
  packetThrottleAcceleration: enetUint32,
  packetThrottleDeceleration: enetUint32,
  packetThrottleInterval: enetUint32,
  pingInterval: enetUint32,
  timeoutLimit: enetUint32,
  timeoutMinimum: enetUint32,
  timeoutMaximum: enetUint32,
  lastRoundTripTime: enetUint32,
  lowestRoundTripTime: enetUint32,
  lastRoundTripTimeVariance: enetUint32,
  highestRoundTripTimeVariance: enetUint32,
  roundTripTime: enetUint32,
  roundTripTimeVariance: enetUint32,
  mtu: enetUint32,
  windowSize: enetUint32,
  reliableDataInTransit: enetUint32,
  outgoingReliableSequenceNumber: enetUint16,
  acknowledgements: enetList,
  sentReliableCommands: enetList,
  outgoingSendReliableCommands: enetList,
  outgoingCommands: enetList,
  dispatchedCommands: enetList,
  flags: enetUint16,
  reserved: enetUint16,
  incomingUnsequencedGroup: enetUint16,
  outgoingUnsequencedGroup: enetUint16,
  unsequencedWindow: koffi.array(
    enetUint32,
    ENET_PEER_UNSEQUENCED_WINDOW_SIZE / UNSEQUENCED_WINDOW_WORD_BITS,
  ),
  eventData: enetUint32,
  totalWaitingData: koffi.types.size_t,
});

const enetCompressor: TypeObject = koffi.struct("ENetCompressor", {
  context: "void *",
  compress: "void *",
  decompress: "void *",
  destroy: "void *",
});

const enetCallbacks: TypeObject = koffi.struct("ENetCallbacks", {
  malloc: "void *",
  free: "void *",
  no_memory: "void *",
});

// Only the size and alignment of this packed union matter to ENetHost
const enetProtocol: TypeObject = koffi.pack("ENetProtocol", {
  bytes: koffi.array(enetUint8, ENET_PROTOCOL_SIZE),
});

const enetHost: TypeObject = koffi.struct("ENetHost", {
  socket: enetSocket,
  address: enetAddress,
  incomingBandwidth: enetUint32,
  outgoingBandwidth: enetUint32,
  bandwidthThrottleEpoch: enetUint32,
  mtu: enetUint32,
  randomSeed: enetUint32,
  recalculateBandwidthLimits: koffi.types.int,
  peers: "ENetPeer *",
  peerCount: koffi.types.size_t,
  channelLimit: koffi.types.size_t,
  serviceTime: enetUint32,
  dispatchQueue: enetList,
  totalQueued: enetUint32,
  packetSize: koffi.types.size_t,
  headerFlags: enetUint16,
  commands: koffi.array(enetProtocol, ENET_PROTOCOL_MAXIMUM_PACKET_COMMANDS),
  commandCount: koffi.types.size_t,
  buffers: koffi.array(enetBuffer, ENET_BUFFER_MAXIMUM),
  bufferCount: koffi.types.size_t,
  checksum: "void *",
  compressor: enetCompressor,
  packetData: koffi.array(
    koffi.array(enetUint8, ENET_PROTOCOL_MAXIMUM_MTU),
    PACKET_DATA_BUFFERS,
  ),
  receivedAddress: enetAddress,
  receivedData: "uint8 *",
  receivedDataLength: koffi.types.size_t,
  totalSentData: enetUint32,
  totalSentPackets: enetUint32,
  totalReceivedData: enetUint32,
  totalReceivedPackets: enetUint32,
  intercept: "void *",
  connectedPeers: koffi.types.size_t,
  bandwidthLimitedPeers: koffi.types.size_t,
  duplicatePeers: koffi.types.size_t,
  maximumPacketSize: koffi.types.size_t,
  maximumWaitingData: koffi.types.size_t,
});

const enetEvent: TypeObject = koffi.struct("ENetEvent", {
  type: koffi.types.int,
  peer: "ENetPeer *",
  channelID: enetUint8,
  data: enetUint32,
  packet: "ENetPacket *",
});

export type {
  NativeAddress,
  NativeBuffer,
  NativeCallbacks,
  NativeCompressor,
  NativeEvent,
};
export {
  enetAddress,
  enetBuffer,
  enetCallbacks,
  enetChannel,
  enetCompressor,
  enetEvent,
  enetHost,
  enetList,
  enetListNode,
  enetPacket,
  enetPeer,
  enetSocket,
  enetUint16,
  enetUint32,
  enetUint8,
};
