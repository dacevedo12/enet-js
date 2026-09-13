import { toNativeAddress, toNativeAddressOrNull } from "./address.js";
import { throwCallbackError } from "./callbacks.js";
import { ENetEventType } from "./enums.js";
import { forgetHost, wrapHost } from "./host-handle.js";
import type { NativeEvent } from "./native/index.js";
import {
  enet_host_bandwidth_limit,
  enet_host_broadcast,
  enet_host_channel_limit,
  enet_host_check_events,
  enet_host_connect,
  enet_host_create,
  enet_host_destroy,
  enet_host_flush,
  enet_host_service,
} from "./native/index.js";
import { wrapPacket } from "./packet.js";
import { forgetPeers, peerOf } from "./peer.js";
import type {
  IENetAddress,
  IENetEvent,
  IENetHost,
  IENetPacket,
  IENetPeer,
} from "./structs.js";
import { nativePointer } from "./structs.js";
import { nonNull } from "./util.js";

const UNSET = 0;

const emptyEvent = (): NativeEvent => ({
  channelID: UNSET,
  data: UNSET,
  packet: null,
  peer: null,
  type: ENetEventType.none,
});

const formatEvent = (host: IENetHost, event: NativeEvent): IENetEvent => {
  const { channelID, data } = event;

  if (event.type === ENetEventType.none) {
    return { channelID, data, packet: null, peer: null, type: event.type };
  }

  const peer = peerOf(
    host[nativePointer],
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
    toNativeAddressOrNull(address),
    peerCount,
    channelLimit,
    incomingBandwidth,
    outgoingBandwidth,
  );

  throwCallbackError();

  return pointer === null ? null : wrapHost(pointer);
};

const destroy = (host: IENetHost): void => {
  const pointer = host[nativePointer];

  enet_host_destroy(pointer);
  forgetHost(pointer);
  forgetPeers(pointer);
  throwCallbackError();
};

const connect = (
  host: IENetHost,
  address: IENetAddress,
  channelCount: number,
  data: number,
): IENetPeer | null => {
  const pointer = enet_host_connect(
    host[nativePointer],
    toNativeAddress(address),
    channelCount,
    data,
  );

  throwCallbackError();

  return pointer === null ? null : peerOf(host[nativePointer], pointer);
};

// Like enet_host_check_events, returning the event instead of filling it in
const checkEvents = (host: IENetHost): IENetEvent => {
  const event = emptyEvent();

  enet_host_check_events(host[nativePointer], event);
  throwCallbackError();

  return formatEvent(host, event);
};

// Like enet_host_service, returning the event instead of filling it in
const service = (host: IENetHost, timeout: number): IENetEvent => {
  const event = emptyEvent();

  enet_host_service(host[nativePointer], event, timeout);
  throwCallbackError();

  return formatEvent(host, event);
};

const flush = (host: IENetHost): void => {
  enet_host_flush(host[nativePointer]);
  throwCallbackError();
};

const broadcast = (
  host: IENetHost,
  channelID: number,
  packet: IENetPacket,
): void => {
  enet_host_broadcast(host[nativePointer], channelID, packet[nativePointer]);
  throwCallbackError();
};

const channelLimit = (host: IENetHost, limit: number): void => {
  enet_host_channel_limit(host[nativePointer], limit);
};

const bandwidthLimit = (
  host: IENetHost,
  incomingBandwidth: number,
  outgoingBandwidth: number,
): void => {
  enet_host_bandwidth_limit(
    host[nativePointer],
    incomingBandwidth,
    outgoingBandwidth,
  );
};

export {
  bandwidthLimit,
  broadcast,
  channelLimit,
  checkEvents,
  connect,
  create,
  destroy,
  flush,
  service,
};
