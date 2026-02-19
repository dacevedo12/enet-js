import koffi from "koffi";

import { ENetPacketFlag } from "./enums.js";
import {
  enetPacket,
  enet_packet_create,
  enet_packet_destroy,
} from "./native/index.js";
import type { IENetPacket } from "./structs.js";

const create = (
  data: Buffer,
  flags: ENetPacketFlag = ENetPacketFlag.none,
): IENetPacket | null => {
  const packet = enet_packet_create(data, data.length, flags) as object | null;

  if (!packet) {
    return null;
  }

  const packetAttributes = koffi.decode(packet, enetPacket) as {
    data: Buffer;
    referenceCount: number;
    flags: number;
    dataLength: number;
  };

  return { ...packetAttributes, data, native: packet };
};

const destroy = (packet: IENetPacket): void => {
  enet_packet_destroy(packet.native);
};

export { create, destroy };
