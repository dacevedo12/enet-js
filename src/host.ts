import { toNativeAddress, toNativeAddressOrNull } from "./address.js";
import { afterCallbacks, throwCallbackError } from "./callbacks.js";
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
  enet_packet_destroy,
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

// Events that service or checkEvents took from ENet before a callback threw, returned by the host's next call
const pendingEvents = new Map<bigint, IENetEvent>();

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

// Removes and returns a host's pending event
const takePendingEvent = (host: bigint): IENetEvent | undefined => {
  const pending = pendingEvents.get(host);

  pendingEvents.delete(host);

  return pending;
};

// Rethrows a callback error, keeping the event ENet had already taken from its queue for the host's next call
const throwKeepingEvent = (host: bigint, event: IENetEvent): void => {
  try {
    throwCallbackError();
  } catch (error) {
    if (event.type !== ENetEventType.none) {
      pendingEvents.set(host, event);
    }

    throw error;
  }
};

// Runs a native call that fills in an event, after returning any pending event
const dispatchEvent = (
  host: IENetHost,
  run: (event: NativeEvent) => void,
): IENetEvent => {
  const pointer = host[nativePointer];
  const pending = takePendingEvent(pointer);

  if (pending !== undefined) {
    return pending;
  }

  const nativeEvent = emptyEvent();

  run(nativeEvent);

  const event = formatEvent(host, nativeEvent);

  throwKeepingEvent(pointer, event);

  return event;
};

const create = (
  address: IENetAddress | null,
  peerCount: number,
  incomingBandwidth: number,
  outgoingBandwidth: number,
): IENetHost | null => {
  const pointer = afterCallbacks(() =>
    enet_host_create(
      toNativeAddressOrNull(address),
      peerCount,
      incomingBandwidth,
      outgoingBandwidth,
    ),
  );

  return pointer === null ? null : wrapHost(pointer);
};

/**
 * Like enet_host_destroy, also destroying the packet of a receive event the
 * host was keeping for its next `service` or `checkEvents`.
 *
 * @param host - The host to destroy.
 */
const destroy = (host: IENetHost): void => {
  const pointer = host[nativePointer];
  const pending = takePendingEvent(pointer);

  afterCallbacks(() => {
    // The app never got a pending RECEIVE, so its packet goes with the host
    if (pending?.type === ENetEventType.receive) {
      enet_packet_destroy(pending.packet[nativePointer]);
    }

    enet_host_destroy(pointer);
    forgetHost(pointer);
    forgetPeers(pointer);
  });
};

const connect = (
  host: IENetHost,
  address: IENetAddress,
  channelCount: number,
): IENetPeer | null => {
  const pointer = afterCallbacks(() =>
    enet_host_connect(
      host[nativePointer],
      toNativeAddress(address),
      channelCount,
    ),
  );

  return pointer === null ? null : peerOf(host[nativePointer], pointer);
};

/**
 * Like enet_host_check_events, returning the event instead of filling it in.
 *
 * A `none` event means that no event was waiting, or that ENet failed. If a
 * callback throws, the error is rethrown once ENet returns, and the host's
 * next `checkEvents` or `service` returns any event ENet had already taken,
 * instead of calling ENet.
 *
 * @param host - The host to check for events.
 * @returns The next waiting event, or a `none` event.
 */
const checkEvents = (host: IENetHost): IENetEvent =>
  dispatchEvent(host, (event) => {
    enet_host_check_events(host[nativePointer], event);
  });

/**
 * Like enet_host_service, returning the event instead of filling it in.
 *
 * A `none` event means that no event occurred before the timeout, or that
 * ENet failed. If a callback throws, the error is rethrown once ENet returns,
 * and the host's next `service` or `checkEvents` returns any event ENet had
 * already taken, instead of calling ENet.
 *
 * @param host - The host to service.
 * @param timeout - How long to wait for an event, in milliseconds.
 * @returns The event that occurred, or a `none` event.
 */
const service = (host: IENetHost, timeout: number): IENetEvent =>
  dispatchEvent(host, (event) => {
    enet_host_service(host[nativePointer], event, timeout);
  });

const flush = (host: IENetHost): void => {
  afterCallbacks(() => {
    enet_host_flush(host[nativePointer]);
  });
};

const broadcast = (
  host: IENetHost,
  channelID: number,
  packet: IENetPacket,
): void => {
  afterCallbacks(() => {
    enet_host_broadcast(host[nativePointer], channelID, packet[nativePointer]);
  });
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
