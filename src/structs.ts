import type { ENetEventType } from "./enums.js";
import type { NativePointer } from "./native/pointers.js";

// Where handles keep their pointer; the package doesn't export it
const nativePointer: unique symbol = Symbol("nativePointer");

interface IENetAddress {
  readonly host: string;
  readonly port: number;
}

/**
 * Computes the checksum of the datagram held in `buffers`, like
 * ENetChecksumCallback. The buffers are views of ENet's memory, valid only
 * during the call.
 *
 * If it throws, or returns something other than a number, ENet gets 0
 * instead, and the error is rethrown once ENet returns, unless another
 * callback threw first.
 */
type ENetChecksumCallback = (buffers: readonly Buffer[]) => number;

/**
 * Called with each datagram the host receives and its sender, like
 * ENetInterceptCallback. `data` is a view of ENet's memory, valid only during
 * the call. Return 1 to consume the datagram, 0 to let ENet process it, or -1
 * to make `enet.host.service` fail.
 *
 * If it throws, or returns something other than a number, ENet gets -1
 * instead, and the error is rethrown once ENet returns, unless another
 * callback threw first.
 */
type ENetInterceptCallback = (
  host: IENetHost,
  data: Buffer,
  address: IENetAddress,
) => number;

/**
 * Called when ENet frees the packet, like ENetPacketFreeCallback. If it
 * throws, the error is rethrown once ENet returns, unless another callback
 * threw first.
 */
type ENetPacketFreeCallback = (packet: IENetPacket) => void;

/**
 * A compressor for `enet.host.compress`, like ENetCompressor with the context
 * kept in the object itself. Buffers passed to its functions are views of
 * ENet's memory, valid only during the call.
 *
 * If `compress` or `decompress` throws, or returns something other than a
 * number, ENet gets 0 instead, and the error is rethrown once ENet returns,
 * unless another callback threw first.
 */
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
  /**
   * Called when a host stops using the compressor, because it got another
   * compressor or `null`, or was destroyed. ENet copies the compressor into
   * each host it's given to, so this runs once for each of them.
   */
  readonly destroy?: () => void;
}

/**
 * Like ENetCallbacks, without `malloc` and `free`, since JS has no native
 * memory to hand out.
 */
interface IENetCallbacks {
  /**
   * Called when ENet fails to allocate memory. If it throws, the error is
   * rethrown once ENet returns, unless another callback threw first.
   */
  readonly noMemory?: () => void;
}

interface IENetHost {
  readonly [nativePointer]: NativePointer<"ENetHost">;
  readonly address: IENetAddress;
  readonly channelLimit: number;
  /**
   * The host's checksum callback, or `null` for none. Assigning `enet.crc32`
   * sets ENet's own CRC32, which runs without calling into JS.
   */
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
  /**
   * A view of the packet's memory, like `packet->data` in C. Read it again
   * after growing the packet with `enet.packet.resize`, which can move it.
   */
  readonly data: Buffer;
  readonly dataLength: number;
  /** Bitwise OR of `ENetPacketFlag` values. */
  readonly flags: number;
  freeCallback: ENetPacketFreeCallback | null;
  readonly referenceCount: number;
  /** Application data, like `packet->userData` in C. */
  userData: unknown;
}

interface IENetPeer {
  readonly [nativePointer]: NativePointer<"ENetPeer">;
  readonly address: IENetAddress;
  readonly channelCount: number;
  /** Application data, like `peer->data` in C. */
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

/** What enet_peer_receive returns, with its `channelID` out-parameter. */
interface IENetPeerReceive {
  readonly channelID: number;
  readonly packet: IENetPacket;
}

/** What enet_socket_accept returns, with its `address` out-parameter. */
interface IENetSocketAccept {
  readonly address: IENetAddress;
  readonly socket: number;
}

/**
 * What enet_socket_receive returns, with its `address` out-parameter, which
 * is `null` when nothing was received.
 */
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
