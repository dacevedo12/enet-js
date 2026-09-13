import koffi from "koffi";

import { readAddress } from "./address.js";
import { throwCallbackError } from "./callbacks.js";
import {
  enetPeer,
  enet_peer_disconnect,
  enet_peer_disconnect_later,
  enet_peer_disconnect_now,
  enet_peer_ping,
  enet_peer_ping_interval,
  enet_peer_receive,
  enet_peer_reset,
  enet_peer_send,
  enet_peer_throttle_configure,
  enet_peer_timeout,
} from "./native/index.js";
import type { NativePointer } from "./native/pointers.js";
import { wrapPacket } from "./packet.js";
import type {
  IENetAddress,
  IENetPacket,
  IENetPeer,
  IENetPeerReceive,
} from "./structs.js";
import { nativePointer } from "./structs.js";
import type { HandlePrototype } from "./util.js";
import { createHandle, readNumber } from "./util.js";

const NO_CHANNEL = 0;
const ADDRESS_OFFSET = koffi.offsetof(enetPeer, "address");
const CHANNEL_COUNT_OFFSET = koffi.offsetof(enetPeer, "channelCount");
const INCOMING_BANDWIDTH_OFFSET = koffi.offsetof(enetPeer, "incomingBandwidth");
const MTU_OFFSET = koffi.offsetof(enetPeer, "mtu");
const OUTGOING_BANDWIDTH_OFFSET = koffi.offsetof(enetPeer, "outgoingBandwidth");
const PACKET_LOSS_OFFSET = koffi.offsetof(enetPeer, "packetLoss");
const ROUND_TRIP_TIME_OFFSET = koffi.offsetof(enetPeer, "roundTripTime");

const peerPrototype: HandlePrototype<IENetPeer, "data"> = {
  get address(): IENetAddress {
    return readAddress(this[nativePointer], ADDRESS_OFFSET);
  },
  get channelCount(): number {
    return readNumber(this[nativePointer], CHANNEL_COUNT_OFFSET, "size_t");
  },
  get incomingBandwidth(): number {
    return readNumber(this[nativePointer], INCOMING_BANDWIDTH_OFFSET, "uint32");
  },
  get mtu(): number {
    return readNumber(this[nativePointer], MTU_OFFSET, "uint32");
  },
  get outgoingBandwidth(): number {
    return readNumber(this[nativePointer], OUTGOING_BANDWIDTH_OFFSET, "uint32");
  },
  get packetLoss(): number {
    return readNumber(this[nativePointer], PACKET_LOSS_OFFSET, "uint32");
  },
  get roundTripTime(): number {
    return readNumber(this[nativePointer], ROUND_TRIP_TIME_OFFSET, "uint32");
  },
};

// One object per peer pointer for each host, so peers compare like ENetPeer * in C
const hostPeers = new Map<bigint, Map<bigint, IENetPeer>>();

const peerOf = (
  host: bigint,
  pointer: NativePointer<"ENetPeer">,
): IENetPeer => {
  const peers = hostPeers.get(host) ?? new Map<bigint, IENetPeer>();
  const known = peers.get(pointer);

  if (known !== undefined) {
    return known;
  }

  const peer = createHandle<IENetPeer, "data">(peerPrototype, pointer, {
    data: null,
  });

  hostPeers.set(host, peers.set(pointer, peer));

  return peer;
};

const forgetPeers = (host: bigint): void => {
  hostPeers.delete(host);
};

const send = (
  peer: IENetPeer,
  channelID: number,
  packet: IENetPacket,
): number => {
  const result = enet_peer_send(
    peer[nativePointer],
    channelID,
    packet[nativePointer],
  );

  throwCallbackError();

  return result;
};

// Like enet_peer_receive, returning the channelID out-parameter with the packet
const receive = (peer: IENetPeer): IENetPeerReceive | null => {
  const channelID: [number] = [NO_CHANNEL];
  const packet = enet_peer_receive(peer[nativePointer], channelID);
  const [channel] = channelID;

  return packet === null
    ? null
    : { channelID: channel, packet: wrapPacket(packet) };
};

const ping = (peer: IENetPeer): void => {
  enet_peer_ping(peer[nativePointer]);
  throwCallbackError();
};

const pingInterval = (peer: IENetPeer, interval: number): void => {
  enet_peer_ping_interval(peer[nativePointer], interval);
};

const timeout = (
  peer: IENetPeer,
  timeoutLimit: number,
  timeoutMinimum: number,
  timeoutMaximum: number,
): void => {
  enet_peer_timeout(
    peer[nativePointer],
    timeoutLimit,
    timeoutMinimum,
    timeoutMaximum,
  );
};

const reset = (peer: IENetPeer): void => {
  enet_peer_reset(peer[nativePointer]);
  throwCallbackError();
};

const disconnect = (peer: IENetPeer, data: number): void => {
  enet_peer_disconnect(peer[nativePointer], data);
  throwCallbackError();
};

const disconnectNow = (peer: IENetPeer, data: number): void => {
  enet_peer_disconnect_now(peer[nativePointer], data);
  throwCallbackError();
};

const disconnectLater = (peer: IENetPeer, data: number): void => {
  enet_peer_disconnect_later(peer[nativePointer], data);
  throwCallbackError();
};

const throttleConfigure = (
  peer: IENetPeer,
  interval: number,
  acceleration: number,
  deceleration: number,
): void => {
  enet_peer_throttle_configure(
    peer[nativePointer],
    interval,
    acceleration,
    deceleration,
  );
  throwCallbackError();
};

export {
  disconnect,
  disconnectLater,
  disconnectNow,
  forgetPeers,
  peerOf,
  ping,
  pingInterval,
  receive,
  reset,
  send,
  throttleConfigure,
  timeout,
};
