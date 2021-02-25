import ref from "ref-napi";

import { ENetPacketFlag } from "./enums";
import { enet_packet_create } from "./native";
import type { IENetPacket } from "./structs";

export const create = (
  data: Buffer,
  flags: ENetPacketFlag = ENetPacketFlag.none
): IENetPacket | null => {
  const packet: Buffer = enet_packet_create(data, data.length, flags);

  if (ref.isNull(packet)) {
    return null;
  }

  const packetAttributes = ref.deref(packet) as Record<string, unknown>;

  return {
    data: packetAttributes.data as Buffer,
    dataLength: packetAttributes.dataLength as number,
    flags: packetAttributes.flags as number,
    native: packet,
    referenceCount: packetAttributes.referenceCount as number,
  };
};
