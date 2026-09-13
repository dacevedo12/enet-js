import type { KoffiFunc } from "koffi";
import koffi from "koffi";

import type { NativePointer } from "./pointers.js";
import type { NativeAddress, NativeEvent } from "./structs.js";

const enetLibPath = process.env["ENET_LIB_PATH"];

if (enetLibPath === undefined) {
  throw new Error(
    "ENET_LIB_PATH is not set; set it to the full path of the ENet shared library",
  );
}

const lib = koffi.load(enetLibPath);

const enet_initialize: KoffiFunc<() => number> = lib.func(
  "int enet_initialize()",
);
const enet_deinitialize: KoffiFunc<() => undefined> = lib.func(
  "void enet_deinitialize()",
);
const enet_host_create: KoffiFunc<
  (
    address: NativeAddress | null,
    peerCount: number,
    channelLimit: number,
    incomingBandwidth: number,
    outgoingBandwidth: number,
  ) => NativePointer<"ENetHost"> | null
> = lib.func(
  "ENetHost *enet_host_create(ENetAddress *address, size_t peerCount, size_t channelLimit, uint32 incomingBandwidth, uint32 outgoingBandwidth)",
);
const enet_host_destroy: KoffiFunc<
  (host: NativePointer<"ENetHost">) => undefined
> = lib.func("void enet_host_destroy(ENetHost *host)");
const enet_host_connect: KoffiFunc<
  (
    host: NativePointer<"ENetHost">,
    address: NativeAddress,
    channelCount: number,
    data: number,
  ) => NativePointer<"ENetPeer"> | null
> = lib.func(
  "ENetPeer *enet_host_connect(ENetHost *host, ENetAddress *address, size_t channelCount, uint32 data)",
);
const enet_host_service: KoffiFunc<
  (
    host: NativePointer<"ENetHost">,
    event: NativeEvent,
    timeout: number,
  ) => number
> = lib.func(
  "int enet_host_service(ENetHost *host, _Out_ ENetEvent *event, uint32 timeout)",
);
const enet_host_flush: KoffiFunc<
  (host: NativePointer<"ENetHost">) => undefined
> = lib.func("void enet_host_flush(ENetHost *host)");
const enet_host_broadcast: KoffiFunc<
  (
    host: NativePointer<"ENetHost">,
    channelID: number,
    packet: NativePointer<"ENetPacket">,
  ) => undefined
> = lib.func(
  "void enet_host_broadcast(ENetHost *host, uint8 channelID, ENetPacket *packet)",
);
const enet_packet_create: KoffiFunc<
  (
    data: Buffer,
    dataLength: number,
    flags: number,
  ) => NativePointer<"ENetPacket"> | null
> = lib.func(
  "ENetPacket *enet_packet_create(void *data, size_t dataLength, uint32 flags)",
);
const enet_packet_destroy: KoffiFunc<
  (packet: NativePointer<"ENetPacket">) => undefined
> = lib.func("void enet_packet_destroy(ENetPacket *packet)");
const enet_peer_send: KoffiFunc<
  (
    peer: NativePointer<"ENetPeer">,
    channelID: number,
    packet: NativePointer<"ENetPacket">,
  ) => number
> = lib.func(
  "int enet_peer_send(ENetPeer *peer, uint8 channelID, ENetPacket *packet)",
);
const enet_peer_disconnect: KoffiFunc<
  (peer: NativePointer<"ENetPeer">, data: number) => undefined
> = lib.func("void enet_peer_disconnect(ENetPeer *peer, uint32 data)");
const enet_peer_reset: KoffiFunc<
  (peer: NativePointer<"ENetPeer">) => undefined
> = lib.func("void enet_peer_reset(ENetPeer *peer)");

export type { NativeAddress, NativeEvent } from "./structs.js";
export { enetAddress, enetPacket, enetPeer } from "./structs.js";
export {
  enet_deinitialize,
  enet_host_broadcast,
  enet_host_connect,
  enet_host_create,
  enet_host_destroy,
  enet_host_flush,
  enet_host_service,
  enet_initialize,
  enet_packet_create,
  enet_packet_destroy,
  enet_peer_disconnect,
  enet_peer_reset,
  enet_peer_send,
};
