import { ENetEventType } from "./enums.js";
import type { NativeAddress, NativeEvent } from "./native/index.js";
import {
  enet_host_broadcast,
  enet_host_connect,
  enet_host_create,
  enet_host_destroy,
  enet_host_flush,
  enet_host_service,
} from "./native/index.js";
import type { NativePointer } from "./native/pointers.js";
import { wrapPacket } from "./packet.js";
import { wrapPeer } from "./peer.js";
import type {
  IENetAddress,
  IENetEvent,
  IENetHost,
  IENetPacket,
  IENetPeer,
} from "./structs.js";
import { nativePointer } from "./structs.js";
import type { HandlePrototype } from "./util.js";
import { createHandle, ipToLong, nonNull } from "./util.js";

const UNSET = 0;

// One object per peer pointer for each host, so peers compare like ENetPeer * in C
const hostPrototype: HandlePrototype<IENetHost> = {};

const hostPeers = new Map<bigint, Map<bigint, IENetPeer>>();

const formatAddress = (address: IENetAddress): NativeAddress => ({
  host: ipToLong(address.host),
  port: address.port,
});

const peerOf = (
  host: IENetHost,
  pointer: NativePointer<"ENetPeer">,
): IENetPeer => {
  const hostPointer = host[nativePointer];
  const peers = hostPeers.get(hostPointer) ?? new Map<bigint, IENetPeer>();
  const known = peers.get(pointer);

  if (known !== undefined) {
    return known;
  }

  const peer = wrapPeer(pointer);

  hostPeers.set(hostPointer, peers.set(pointer, peer));

  return peer;
};

const formatEvent = (host: IENetHost, event: NativeEvent): IENetEvent => {
  const { channelID, data } = event;

  if (event.type === ENetEventType.none) {
    return { channelID, data, packet: null, peer: null, type: event.type };
  }

  const peer = peerOf(
    host,
    nonNull(event.peer, "ENet reported an event without a peer"),
  );

  if (event.type === ENetEventType.receive) {
    return {
      channelID,
      data,
      packet: wrapPacket(
        nonNull(event.packet, "ENet reported a receive event without a packet"),
      ),
      peer,
      type: event.type,
    };
  }

  return { channelID, data, packet: null, peer, type: event.type };
};

const create = (
  address: IENetAddress | null,
  peerCount: number,
  channelLimit: number,
  incomingBandwidth: number,
  outgoingBandwidth: number,
): IENetHost | null => {
  const pointer = enet_host_create(
    address === null ? null : formatAddress(address),
    peerCount,
    channelLimit,
    incomingBandwidth,
    outgoingBandwidth,
  );

  if (pointer === null) {
    return null;
  }

  return createHandle<IENetHost>(hostPrototype, pointer);
};

const destroy = (host: IENetHost): void => {
  enet_host_destroy(host[nativePointer]);
  hostPeers.delete(host[nativePointer]);
};

const connect = (
  host: IENetHost,
  address: IENetAddress,
  channelCount: number,
  data: number,
): IENetPeer | null => {
  const pointer = enet_host_connect(
    host[nativePointer],
    formatAddress(address),
    channelCount,
    data,
  );

  return pointer === null ? null : peerOf(host, pointer);
};

const service = (host: IENetHost, timeout: number): IENetEvent => {
  const event: NativeEvent = {
    channelID: UNSET,
    data: UNSET,
    packet: null,
    peer: null,
    type: ENetEventType.none,
  };

  enet_host_service(host[nativePointer], event, timeout);

  return formatEvent(host, event);
};

const flush = (host: IENetHost): void => {
  enet_host_flush(host[nativePointer]);
};

const broadcast = (
  host: IENetHost,
  channelID: number,
  packet: IENetPacket,
): void => {
  enet_host_broadcast(host[nativePointer], channelID, packet[nativePointer]);
};

export { broadcast, connect, create, destroy, flush, service };
