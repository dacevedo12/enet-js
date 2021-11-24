import ref from "ref-napi";

import { ENetEventType } from "./enums";
import {
  enet_host_broadcast,
  enet_host_connect,
  enet_host_create,
  enet_host_destroy,
  enet_host_flush,
  enet_host_service,
} from "./native";
import type { enetHost, enetPacket, enetPeer } from "./native/structs";
import { enetAddress, enetEvent } from "./native/structs";
import type {
  IENetAddress,
  IENetEvent,
  IENetHost,
  IENetPacket,
  IENetPeer,
} from "./structs";
import { ipFromLong, ipToLong } from "./util";

const broadcast = (
  host: IENetHost,
  channelID: number,
  packet: IENetPacket
): void => {
  enet_host_broadcast(host.native, channelID, packet.native);
};

const formatAddress = (
  address: IENetAddress
): ref.Pointer<ReturnType<typeof enetAddress>> =>
  enetAddress({
    host: ipToLong(address.host),
    port: address.port,
  }).ref();

const formatPeer = (
  peer: ref.Pointer<ReturnType<typeof enetPeer>>
): IENetPeer => {
  const peerAttributes = ref.deref(peer);
  const peerAddress = peerAttributes.address;
  const peerObject = {
    address: {
      host: ipFromLong(peerAddress.host),
      port: peerAddress.port,
    },
    mtu: peerAttributes.mtu,
    native: peer,
  };

  // eslint-disable-next-line fp/no-mutating-methods
  Object.defineProperty(peerObject, "mtu", {
    get: () => peerAttributes.mtu,
    set: (value: number): void => {
      // eslint-disable-next-line fp/no-mutating-assign
      Object.assign(peerAttributes, { mtu: value });
    },
  });

  return peerObject;
};

const connect = (
  host: IENetHost,
  address: IENetAddress,
  channelCount: number
): IENetPeer | null => {
  const peer = enet_host_connect(
    host.native,
    formatAddress(address),
    channelCount
  );

  return formatPeer(peer);
};

const formatNullableAddress = (
  address: IENetAddress | null
): ref.Pointer<ReturnType<typeof enetAddress>> | ref.Value<null> => {
  if (address === null) {
    return ref.NULL;
  }

  return formatAddress(address);
};

const formatHost = (
  host: ref.Pointer<ReturnType<typeof enetHost>>
): IENetHost => {
  return {
    native: host,
  };
};

const create = (
  address: IENetAddress | null,
  peerCount: number,
  incomingBandwidth: number,
  outgoingBandwidth: number
): IENetHost | null => {
  const host = enet_host_create(
    formatNullableAddress(address),
    peerCount,
    incomingBandwidth,
    outgoingBandwidth
  );

  if (ref.isNull(host)) {
    return null;
  }

  return formatHost(host);
};

const destroy = (host: IENetHost): void => {
  enet_host_destroy(host.native);
};

const flush = (host: IENetHost): void => {
  enet_host_flush(host.native);
};

const formatPacket = (
  packet: ref.Pointer<ReturnType<typeof enetPacket>>
): IENetPacket => {
  const packetAttributes = ref.deref(packet);

  // Workaround to properly set the actual size of each packet
  // eslint-disable-next-line fp/no-mutating-assign
  Object.assign(packetAttributes.data.type, {
    size: packetAttributes.dataLength,
  });

  return {
    data: packetAttributes.data,
    dataLength: Number(packetAttributes.dataLength),
    flags: packetAttributes.flags,
    native: packet,
    referenceCount: Number(packetAttributes.referenceCount),
  };
};

const formatEvent = (
  event: ref.Pointer<ReturnType<typeof enetEvent>>
): IENetEvent => {
  const eventAttributes = ref.deref(event);
  const baseAttributes = {
    channelID: eventAttributes.channelID,
    data: eventAttributes.data,
    native: event,
    type: eventAttributes.type,
  };

  if (eventAttributes.type === ENetEventType.none) {
    return { ...baseAttributes, packet: null, peer: null };
  }

  if (eventAttributes.type === ENetEventType.receive) {
    return {
      ...baseAttributes,
      packet: formatPacket(eventAttributes.packet),
      peer: formatPeer(eventAttributes.peer),
    };
  }

  return {
    ...baseAttributes,
    peer: formatPeer(eventAttributes.peer),
  };
};

const service = (host: IENetHost, timeout: number): IENetEvent | null => {
  const event = ref.alloc(enetEvent) as unknown as ref.Pointer<
    ReturnType<typeof enetEvent>
  >;
  const pendingEvents = enet_host_service(host.native, event, timeout);

  if (pendingEvents > 0) {
    return formatEvent(event);
  }

  return null;
};

export { broadcast, connect, create, destroy, flush, service };
