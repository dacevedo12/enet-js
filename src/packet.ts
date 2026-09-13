import { ENetPacketFlag } from "./enums.js";
import {
  decodePacket,
  enet_packet_create,
  enet_packet_destroy,
} from "./native/index.js";
import type { IENetPacket } from "./structs.js";

const create = (
  data: Buffer,
  flags: number = ENetPacketFlag.none,
): IENetPacket | null => {
  const packet = enet_packet_create(data, data.length, flags);

  if (packet === null) {
    return null;
  }

  const attributes = decodePacket(packet);

  return {
    data,
    dataLength: attributes.dataLength,
    flags: attributes.flags,
    native: packet,
    referenceCount: attributes.referenceCount,
  };
};

const destroy = (packet: IENetPacket): void => {
  enet_packet_destroy(packet.native);
};

export { create, destroy };
