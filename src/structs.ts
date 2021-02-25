import type { ENetEventType, ENetPacketFlag } from "./enums";

export interface IENetAddress {
  host: string;
  port: number;
}

export interface IENetEvent {
  native: Buffer;
  channelID: number;
  data: number;
  packet: IENetPacket | null;
  peer: IENetPeer;
  type: ENetEventType;
}

export interface IENetHost {
  native: Buffer;
  peers: IENetPeer[];
}

export interface IENetPacket {
  native: Buffer;
  referenceCount: number;
  flags: ENetPacketFlag;
  data: Buffer;
  dataLength: number;
}

export interface IENetPeer {
  native: Buffer;
  address: IENetAddress;
  mtu: number;
}
