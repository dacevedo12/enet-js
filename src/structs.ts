import type { ENetEventType, ENetPacketFlag } from "./enums.js";

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
  native: object;
}

interface IENetPacket {
  data: Buffer;
  dataLength: number;
  flags: ENetPacketFlag;
  native: object;
  referenceCount: number;
}

interface IENetPeer {
  address: IENetAddress;
  mtu: number;
  native: object;
}

export type { IENetAddress, IENetEvent, IENetHost, IENetPacket, IENetPeer };
