import type { ENetEventType, ENetPacketFlag } from "./enums";

interface IENetAddress {
  host: string;
  port: number;
}

interface IENetEvent {
  channelID: number;
  data: number;
  native: Buffer;
  packet: IENetPacket | null;
  peer: IENetPeer;
  type: ENetEventType;
}

interface IENetHost {
  native: Buffer;
  peers: IENetPeer[];
}

interface IENetPacket {
  data: Buffer;
  dataLength: number;
  flags: ENetPacketFlag;
  native: Buffer;
  referenceCount: number;
}

interface IENetPeer {
  address: IENetAddress;
  mtu: number;
  native: Buffer;
}

export { IENetAddress, IENetEvent, IENetHost, IENetPacket, IENetPeer };
