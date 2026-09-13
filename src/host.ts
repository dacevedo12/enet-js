import koffi from "koffi";

import { ENetEventType } from "./enums.js";
import {
  enetPacket,
  enetPeer,
  enet_host_broadcast,
  enet_host_connect,
  enet_host_create,
  enet_host_destroy,
  enet_host_flush,
  enet_host_service,
} from "./native/index.js";
import type {
  IENetAddress,
  IENetEvent,
  IENetHost,
  IENetPacket,
  IENetPeer,
} from "./structs.js";
import { ipFromLong, ipToLong } from "./util.js";

const broadcast = (
  host: IENetHost,
  channelID: number,
  packet: IENetPacket,
): void => {
  enet_host_broadcast(host.native, channelID, packet.native);
};

const formatAddress = (address: IENetAddress): { host: number; port: number } =>
  ({
    host: ipToLong(address.host),
    port: address.port,
  }) as const;

const formatPeer = (peer: IENetPeer["native"]): IENetPeer => {
  const peerAttributes = koffi.decode(peer, enetPeer) as {
    address: { host: number; port: number };
    mtu: number;
  };
  const peerAddress = peerAttributes.address;

  return {
    address: {
      host: ipFromLong(peerAddress.host),
      port: peerAddress.port,
    },
    mtu: peerAttributes.mtu,
    native: peer,
  };
};

const connect = (
  host: IENetHost,
  address: IENetAddress,
  channelCount: number,
): IENetPeer | null => {
  const peer = enet_host_connect(
    host.native,
    formatAddress(address),
    channelCount,
  ) as IENetPeer["native"] | null;

  if (peer === null) {
    return null;
  }

  return formatPeer(peer);
};

const create = (
  address: IENetAddress | null,
  peerCount: number,
  incomingBandwidth: number,
  outgoingBandwidth: number,
): IENetHost | null => {
  const host = enet_host_create(
    address ? formatAddress(address) : null,
    peerCount,
    incomingBandwidth,
    outgoingBandwidth,
  ) as IENetHost["native"] | null;

  if (host === null) {
    return null;
  }

  return { native: host };
};

const destroy = (host: IENetHost): void => {
  enet_host_destroy(host.native);
};

const flush = (host: IENetHost): void => {
  enet_host_flush(host.native);
};

const formatPacket = (packet: IENetPacket["native"]): IENetPacket => {
  const packetAttributes = koffi.decode(packet, enetPacket) as {
    data: bigint;
    dataLength: number;
    flags: number;
    referenceCount: number;
  };
  const dataView = koffi.view(
    packetAttributes.data,
    packetAttributes.dataLength,
  );

  return {
    ...packetAttributes,
    data: Buffer.from(dataView),
    native: packet,
  };
};

const formatEvent = (event: object): IENetEvent => {
  const eventAttributes = event as {
    channelID: number;
    data: number;
    packet: IENetPacket["native"] | null;
    peer: IENetPeer["native"] | null;
    type: ENetEventType;
  };

  if (eventAttributes.type === ENetEventType.none) {
    return {
      ...eventAttributes,
      native: event,
      packet: null,
      peer: null,
      type: ENetEventType.none,
    };
  }

  if (eventAttributes.type === ENetEventType.receive) {
    return {
      ...eventAttributes,
      native: event,
      packet: formatPacket(eventAttributes.packet!),
      peer: formatPeer(eventAttributes.peer!),
      type: ENetEventType.receive,
    };
  }

  return {
    ...eventAttributes,
    native: event,
    packet: null,
    peer: formatPeer(eventAttributes.peer!),
    type: eventAttributes.type,
  };
};

const service = (host: IENetHost, timeout: number): IENetEvent => {
  const event = {};
  enet_host_service(host.native, event, timeout);

  return formatEvent(event);
};

export { broadcast, connect, create, destroy, flush, service };
