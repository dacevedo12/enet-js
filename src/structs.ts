import type { ENetEventType } from "./enums.js";
import type { NativePointer } from "./native/pointers.js";

// Where handles keep their pointer; the package doesn't export it
const nativePointer: unique symbol = Symbol("nativePointer");

interface IENetAddress {
  readonly host: string;
  readonly port: number;
}

interface IENetHost {
  readonly [nativePointer]: NativePointer<"ENetHost">;
}

interface IENetPacket {
  readonly [nativePointer]: NativePointer<"ENetPacket">;
  // A view of the packet's memory, like packet->data in C
  readonly data: Buffer;
  readonly dataLength: number;
  // Bitwise OR of ENetPacketFlag values
  readonly flags: number;
  readonly referenceCount: number;
}

interface IENetPeer {
  readonly [nativePointer]: NativePointer<"ENetPeer">;
  readonly address: IENetAddress;
  readonly mtu: number;
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

export type { IENetAddress, IENetEvent, IENetHost, IENetPacket, IENetPeer };
export { nativePointer };
