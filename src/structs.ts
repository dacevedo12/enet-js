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

interface IENetEventBase {
  channelID: number;
  data: number;
  native: ref.Pointer<ReturnType<typeof enetEvent>>;
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
  peer: IENetPeer;
  type: ENetEventType.connect | ENetEventType.disconnect;
}

// eslint-disable-next-line @typescript-eslint/no-type-alias
type IENetEvent = IENetEventEmpty | IENetEventWithPacket | IENetEventWithPeer;

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
