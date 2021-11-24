import type ref from "ref-napi";

import type { ENetEventType, ENetPacketFlag } from "./enums";
import type {
  enetEvent,
  enetHost,
  enetPacket,
  enetPeer,
} from "./native/structs";

interface IENetAddress {
  host: string;
  port: number;
}

interface IENetEvent {
  channelID: number;
  data: number;
  native: ref.Pointer<ReturnType<typeof enetEvent>>;
  packet: IENetPacket | null;
  peer: IENetPeer;
  type: ENetEventType;
}

interface IENetHost {
  native: ref.Pointer<ReturnType<typeof enetHost>>;
}

interface IENetPacket {
  data: Buffer;
  dataLength: number;
  flags: ENetPacketFlag;
  native: ref.Pointer<ReturnType<typeof enetPacket>>;
  referenceCount: number;
}

interface IENetPeer {
  address: IENetAddress;
  mtu: number;
  native: ref.Pointer<ReturnType<typeof enetPeer>>;
}

export type { IENetAddress, IENetEvent, IENetHost, IENetPacket, IENetPeer };
