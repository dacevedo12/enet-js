import type { ENetEventType } from "./enums.js";
import type { NativePointer } from "./native/pointers.js";

interface IENetAddress {
  readonly host: string;
  readonly port: number;
}

interface IENetEventBase {
  readonly channelID: number;
  readonly data: number;
  readonly native: object;
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

interface IENetHost {
  readonly native: NativePointer<"ENetHost">;
}

interface IENetPacket {
  readonly data: Buffer;
  readonly dataLength: number;
  // Bitwise OR of ENetPacketFlag values
  readonly flags: number;
  readonly native: NativePointer<"ENetPacket">;
  readonly referenceCount: number;
}

interface IENetPeer {
  readonly address: IENetAddress;
  readonly mtu: number;
  readonly native: NativePointer<"ENetPeer">;
}

export type { IENetAddress, IENetEvent, IENetHost, IENetPacket, IENetPeer };
