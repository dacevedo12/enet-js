import ref from "ref-napi";

import type { ENetEventType } from "./enums";
import { enet_host_create, enet_host_service } from "./native";
import { enetAddress, enetEvent } from "./native/structs";
import type {
  IENetAddress,
  IENetEvent,
  IENetHost,
  IENetPacket,
  IENetPeer,
} from "./structs";
import { ipFromLong, ipToLong } from "./util";

const create = (
  address: IENetAddress,
  peerCount: number,
  incomingBandwidth: number,
  outgoingBandwidth: number
): IENetHost | null => {
  const addressStruct = enetAddress({
    host: ipToLong(address.host),
    port: address.port,
  }) as Buffer;
  const host = enet_host_create(
    addressStruct.ref(addressStruct),
    peerCount,
    incomingBandwidth,
    outgoingBandwidth
  );

  if (ref.isNull(host)) {
    return null;
  }

  const hostAttributes = ref.deref(host) as Record<string, unknown>;

  return {
    native: host,
    peers: (hostAttributes.peers as {
      toArray: () => unknown[];
    }).toArray() as IENetPeer[],
  };
};

const formatPacket = (packetInstance: Buffer): IENetPacket | null => {
  if (ref.isNull(packetInstance)) {
    return null;
  }

  const packetAttributes = ref.deref(packetInstance) as Record<string, unknown>;
  const dataLength = packetAttributes.dataLength as number;

  // Workaround to properly set the actual size of each packet
  // eslint-disable-next-line fp/no-mutating-assign
  Object.assign((packetAttributes.data as Buffer).type, { size: dataLength });

  return {
    data: packetAttributes.data as Buffer,
    dataLength,
    flags: packetAttributes.flags as number,
    native: packetInstance,
    referenceCount: packetAttributes.referenceCount as number,
  };
};

const formatPeer = (peerInstance: Buffer): IENetPeer => {
  const peerAttributes = ref.deref(peerInstance) as Record<string, unknown>;
  const peerAddress = peerAttributes.address as Record<string, number>;
  const peer = {
    address: {
      host: ipFromLong(peerAddress.host),
      port: peerAddress.port,
    },
    mtu: peerAttributes.mtu as number,
    native: peerInstance,
  };

  // eslint-disable-next-line fp/no-mutating-methods
  Object.defineProperty(peer, "mtu", {
    get: () => peer.mtu,
    set: (value: number): void => {
      // eslint-disable-next-line fp/no-mutating-assign
      Object.assign(peerAttributes, { mtu: value });
    },
  });

  return peer;
};

const formatEvent = (eventInstance: Buffer): IENetEvent => {
  const eventAttributes = ref.deref(eventInstance) as Record<string, unknown>;

  return {
    channelID: eventAttributes.channelID as number,
    data: eventAttributes.data as number,
    native: eventInstance,
    packet: formatPacket(eventAttributes.packet as Buffer),
    peer: formatPeer(eventAttributes.peer as Buffer),
    type: eventAttributes.type as ENetEventType,
  };
};

const getEvents = (
  host: IENetHost,
  timeout: number,
  events: IENetEvent[]
): IENetEvent[] => {
  const event = ref.alloc(enetEvent);
  const pendingEvents = enet_host_service(host.native, event, timeout);

  if (pendingEvents <= 0) {
    return events;
  }

  return [formatEvent(event), ...getEvents(host, timeout, events)];
};

const service = (host: IENetHost, timeout: number): IENetEvent[] =>
  getEvents(host, timeout, []);

export { create, service };
