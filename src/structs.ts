import type { ENetEventType, ENetPacketFlag } from "./enums.js";

declare const pointerType: unique symbol;

// Koffi pointers are plain bigints, so the pointed-to type is tracked at compile time
type NativePointer<Type extends string> = bigint & {
  readonly [pointerType]: Type;
};

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
  type: ENetEventType.none;
}

interface IENetEventWithPacket extends IENetEventBase {
  packet: IENetPacket;
  peer: IENetPeer;
  type: ENetEventType.receive;
}

interface IENetEventWithPeer extends IENetEventBase {
  packet: null;
  peer: IENetPeer;
  type: ENetEventType.connect | ENetEventType.disconnect;
}

type IENetEvent = IENetEventEmpty | IENetEventWithPacket | IENetEventWithPeer;

interface IENetHost {
  native: NativePointer<"ENetHost">;
}

interface IENetPacket {
  data: Buffer;
  dataLength: number;
  flags: ENetPacketFlag;
  native: NativePointer<"ENetPacket">;
  referenceCount: number;
}

interface IENetPeer {
  address: IENetAddress;
  mtu: number;
  native: NativePointer<"ENetPeer">;
}

export type { IENetAddress, IENetEvent, IENetHost, IENetPacket, IENetPeer };
