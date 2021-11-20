import ref from "ref-napi";

import { ENetPacketFlag } from "./enums";
import { enet_packet_create, enet_packet_destroy } from "./native";
import type { IENetPacket } from "./structs";

const create = (
  data: Buffer,
  flags: ENetPacketFlag = ENetPacketFlag.none
): IENetPacket | null => {
  const packet = enet_packet_create(
    data as ref.Pointer<void>,
    data.length,
    flags
  );

  if (ref.isNull(packet)) {
    return null;
  }

  const packetAttributes = ref.deref(packet);

  return {
    data: packetAttributes.data as Buffer,
    dataLength: packetAttributes.dataLength as number,
    flags: packetAttributes.flags,
    native: packet,
    referenceCount: packetAttributes.referenceCount as number,
  };
};

const destroy = (packet: IENetPacket): void => {
  enet_packet_destroy(packet.native);
};

export { create, destroy };
