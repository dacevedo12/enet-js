import { ENetPacketFlag } from "./enet";
import type { IENetPacket } from "./enet";
import { enet_packet_create } from "./native";
import ref from "ref-napi";

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
