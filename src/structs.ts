import type { ENetEventType } from "./enums.js";
import type { NativePointer } from "./native/pointers.js";

interface IENetAddress {
  host: string;
  port: number;
}

interface IENetEventBase {
  channelID: number;
  data: number;
  native: object;
}

interface IENetEventEmpty extends IENetEventBase {
  packet: null;
  peer: null;
  type: typeof ENetEventType.none;
}

interface IENetEventWithPacket extends IENetEventBase {
  packet: IENetPacket;
  peer: IENetPeer;
  type: typeof ENetEventType.receive;
}

interface IENetEventWithPeer extends IENetEventBase {
  packet: null;
  peer: IENetPeer;
  type: typeof ENetEventType.connect | typeof ENetEventType.disconnect;
}

type IENetEvent = IENetEventEmpty | IENetEventWithPacket | IENetEventWithPeer;

interface IENetHost {
  native: NativePointer<"ENetHost">;
}

interface IENetPacket {
  data: Buffer;
  dataLength: number;
  // Bitwise OR of ENetPacketFlag values
  flags: number;
  native: NativePointer<"ENetPacket">;
  referenceCount: number;
}

interface IENetPeer {
  address: IENetAddress;
  mtu: number;
  native: NativePointer<"ENetPeer">;
}

export type { IENetAddress, IENetEvent, IENetHost, IENetPacket, IENetPeer };
