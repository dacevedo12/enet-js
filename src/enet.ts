import * as host from "./host";
import * as packet from "./packet";
import * as peer from "./peer";
import { enet_initialize } from "./native";

export const ENET_HOST_ANY = "0.0.0.0";

export enum ENetEventType {
  none = 0,
  connect = 1,
  disconnect = 2,
  receive = 3,
}

export enum ENetPacketFlag {
  none = 0,
  reliable = 1,
  unsequenced = 2,
  noAllocate = 4,
}

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
  flags: number;
  data: Buffer;
  dataLength: number;
}

export interface IENetPeer {
  native: Buffer;
  address: IENetAddress;
  mtu: number;
}

const initialize = (): number => enet_initialize();

export const enet = {
  host,
  initialize,
  packet,
  peer,
};
