import koffi from "koffi";

import { ENetEventType } from "./enums.js";
import type { NativeAddress, NativeEvent } from "./native/index.js";
import {
  decodePacket,
  decodePeer,
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
import { ipFromLong, ipToLong, nonNull } from "./util.js";

const UNSET = 0;

const broadcast = (
  host: IENetHost,
  channelID: number,
  packet: IENetPacket,
): void => {
  enet_host_broadcast(host.native, channelID, packet.native);
};

const formatAddress = (address: IENetAddress): NativeAddress => ({
  host: ipToLong(address.host),
  port: address.port,
});

const formatPeer = (peer: IENetPeer["native"]): IENetPeer => {
  const { address, mtu } = decodePeer(peer);

  return {
    address: {
      host: ipFromLong(address.host),
      port: address.port,
    },
    mtu,
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
  );

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
    address === null ? null : formatAddress(address),
    peerCount,
    incomingBandwidth,
    outgoingBandwidth,
  );

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
  const attributes = decodePacket(packet);

  return {
    data: Buffer.from(koffi.view(attributes.data, attributes.dataLength)),
    dataLength: attributes.dataLength,
    flags: attributes.flags,
    native: packet,
    referenceCount: attributes.referenceCount,
  };
};

const formatEvent = (event: NativeEvent): IENetEvent => {
  const base = { channelID: event.channelID, data: event.data, native: event };

  if (event.type === ENetEventType.none) {
    return { ...base, packet: null, peer: null, type: ENetEventType.none };
  }

  if (event.type === ENetEventType.receive) {
    return {
      ...base,
      packet: formatPacket(
        nonNull(event.packet, "ENet reported a receive event without a packet"),
      ),
      peer: formatPeer(
        nonNull(event.peer, "ENet reported a receive event without a peer"),
      ),
      type: ENetEventType.receive,
    };
  }

  return {
    ...base,
    packet: null,
    peer: formatPeer(
      nonNull(event.peer, "ENet reported a connection event without a peer"),
    ),
    type: event.type,
  };
};

const service = (host: IENetHost, timeout: number): IENetEvent => {
  const event: NativeEvent = {
    channelID: UNSET,
    data: UNSET,
    packet: null,
    peer: null,
    type: ENetEventType.none,
  };

  enet_host_service(host.native, event, timeout);

  return formatEvent(event);
};

export { broadcast, connect, create, destroy, flush, service };
