import type { ENetEventType } from "./enums.js";
import type { NativePointer } from "./native/pointers.js";

// Where handles keep their pointer; the package doesn't export it
const nativePointer: unique symbol = Symbol("nativePointer");

interface IENetAddress {
  readonly host: string;
  readonly port: number;
}

// Computes the checksum of the datagram held in buffers, like ENetChecksumCallback
type ENetChecksumCallback = (buffers: readonly Buffer[]) => number;

// Called with each received datagram and its sender, where data is only valid during the call: 1 consumes it, 0 lets ENet process it, -1 makes service fail
type ENetInterceptCallback = (
  host: IENetHost,
  data: Buffer,
  address: IENetAddress,
) => number;

type ENetPacketFreeCallback = (packet: IENetPacket) => void;

// Like ENetCompressor, with the context kept in the object itself
interface IENetCompressor {
  readonly compress: (
    inBuffers: readonly Buffer[],
    inLimit: number,
    outData: Buffer,
    outLimit: number,
  ) => number;
  readonly decompress: (
    inData: Buffer,
    inLimit: number,
    outData: Buffer,
    outLimit: number,
  ) => number;
  readonly destroy?: () => void;
}

// Like ENetCallbacks: malloc and free can't be JS, which has no native memory to hand out
interface IENetCallbacks {
  readonly noMemory?: () => void;
}

interface IENetHost {
  readonly [nativePointer]: NativePointer<"ENetHost">;
  readonly address: IENetAddress;
  readonly channelLimit: number;
  checksum: ENetChecksumCallback | null;
  duplicatePeers: number;
  readonly incomingBandwidth: number;
  intercept: ENetInterceptCallback | null;
  maximumPacketSize: number;
  maximumWaitingData: number;
  readonly outgoingBandwidth: number;
  readonly peerCount: number;
  readonly peers: readonly IENetPeer[];
  totalReceivedData: number;
  totalReceivedPackets: number;
  totalSentData: number;
  totalSentPackets: number;
}

interface IENetPacket {
  readonly [nativePointer]: NativePointer<"ENetPacket">;
  // A view of the packet's memory, like packet->data in C
  readonly data: Buffer;
  readonly dataLength: number;
  // Bitwise OR of ENetPacketFlag values
  readonly flags: number;
  freeCallback: ENetPacketFreeCallback | null;
  readonly referenceCount: number;
  // Application data, like packet->userData in C
  userData: unknown;
}

interface IENetPeer {
  readonly [nativePointer]: NativePointer<"ENetPeer">;
  readonly address: IENetAddress;
  readonly channelCount: number;
  // Application data, like peer->data in C
  data: unknown;
  readonly incomingBandwidth: number;
  readonly mtu: number;
  readonly outgoingBandwidth: number;
  readonly packetLoss: number;
  readonly roundTripTime: number;
}

interface IENetRangeCoder {
  readonly [nativePointer]: NativePointer<"ENetRangeCoder">;
}

interface IENetEventBase {
  readonly channelID: number;
  readonly data: number;
}

interface IENetEventEmpty extends IENetEventBase {
  readonly packet: null;
  readonly peer: null;
  readonly type: typeof ENetEventType.none;
}

interface IENetEventWithPacket extends IENetEventBase {
  readonly packet: IENetPacket;
  readonly peer: IENetPeer;
  readonly type: typeof ENetEventType.receive;
}

interface IENetEventWithPeer extends IENetEventBase {
  readonly packet: null;
  readonly peer: IENetPeer;
  readonly type: typeof ENetEventType.connect | typeof ENetEventType.disconnect;
}

type IENetEvent = IENetEventEmpty | IENetEventWithPacket | IENetEventWithPeer;

// What enet_peer_receive returns along with its channelID out-parameter
interface IENetPeerReceive {
  readonly channelID: number;
  readonly packet: IENetPacket;
}

// What enet_socket_accept returns along with its address out-parameter
interface IENetSocketAccept {
  readonly address: IENetAddress;
  readonly socket: number;
}

// What enet_socket_receive returns along with its address out-parameter, null when nothing was received
interface IENetSocketReceive {
  readonly address: IENetAddress | null;
  readonly result: number;
}

export type {
  ENetChecksumCallback,
  ENetInterceptCallback,
  ENetPacketFreeCallback,
  IENetAddress,
  IENetCallbacks,
  IENetCompressor,
  IENetEvent,
  IENetHost,
  IENetPacket,
  IENetPeer,
  IENetPeerReceive,
  IENetRangeCoder,
  IENetSocketAccept,
  IENetSocketReceive,
};
export { nativePointer };
