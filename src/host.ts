import ref from "ref-napi";

import {
  enet_host_broadcast,
  enet_host_create,
  enet_host_destroy,
  enet_host_service,
} from "./native";
import type { enetPacket, enetPeer } from "./native/structs";
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

const create = (
  address: IENetAddress,
  peerCount: number,
  incomingBandwidth: number,
  outgoingBandwidth: number
): IENetHost | null => {
  const addressStruct = enetAddress({
    host: ipToLong(address.host),
    port: address.port,
  });
  const host = enet_host_create(
    addressStruct.ref(),
    peerCount,
    incomingBandwidth,
    outgoingBandwidth
  );

  if (ref.isNull(host)) {
    return null;
  }

  const hostAttributes = ref.deref(host);

  return {
    native: host,
    peers: (
      hostAttributes.peers as {
        toArray: () => unknown[];
      }
    ).toArray() as IENetPeer[],
  };
};

const destroy = (host: IENetHost): void => {
  enet_host_destroy(host.native);
};

const formatPacket = (
  packet: ref.Pointer<ReturnType<typeof enetPacket>>
): IENetPacket | null => {
  if (ref.isNull(packet)) {
    return null;
  }

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

const formatEvent = (
  event: ref.Pointer<ReturnType<typeof enetEvent>>
): IENetEvent => {
  const eventAttributes = ref.deref(event);

  return {
    channelID: eventAttributes.channelID,
    data: eventAttributes.data,
    native: event,
    packet: formatPacket(eventAttributes.packet),
    peer: formatPeer(eventAttributes.peer),
    type: eventAttributes.type,
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

export { broadcast, create, destroy, service };
