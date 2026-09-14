import type { KoffiFunc } from "koffi";

import type { NativeAddress, NativeEvent } from "./library.js";
import { lib } from "./library.js";
import type { NativePointer } from "./pointers.js";

const enet_host_create: KoffiFunc<
  (
    address: NativeAddress | null,
    peerCount: number,
    incomingBandwidth: number,
    outgoingBandwidth: number,
  ) => NativePointer<"ENetHost"> | null
> = lib.func(
  "ENetHost *enet_host_create(const ENetAddress *address, size_t peerCount, uint32 incomingBandwidth, uint32 outgoingBandwidth)",
);
const enet_host_destroy: KoffiFunc<
  (host: NativePointer<"ENetHost">) => undefined
> = lib.func("void enet_host_destroy(ENetHost *host)");
const enet_host_connect: KoffiFunc<
  (
    host: NativePointer<"ENetHost">,
    address: NativeAddress,
    channelCount: number,
  ) => NativePointer<"ENetPeer"> | null
> = lib.func(
  "ENetPeer *enet_host_connect(ENetHost *host, const ENetAddress *address, size_t channelCount)",
);
const enet_host_check_events: KoffiFunc<
  (host: NativePointer<"ENetHost">, event: NativeEvent) => number
> = lib.func(
  "int enet_host_check_events(ENetHost *host, _Out_ ENetEvent *event)",
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
const enet_host_channel_limit: KoffiFunc<
  (host: NativePointer<"ENetHost">, channelLimit: number) => undefined
> = lib.func(
  "void enet_host_channel_limit(ENetHost *host, size_t channelLimit)",
);
const enet_host_bandwidth_limit: KoffiFunc<
  (
    host: NativePointer<"ENetHost">,
    incomingBandwidth: number,
    outgoingBandwidth: number,
  ) => undefined
> = lib.func(
  "void enet_host_bandwidth_limit(ENetHost *host, uint32 incomingBandwidth, uint32 outgoingBandwidth)",
);

export {
  enet_host_bandwidth_limit,
  enet_host_broadcast,
  enet_host_channel_limit,
  enet_host_check_events,
  enet_host_connect,
  enet_host_create,
  enet_host_destroy,
  enet_host_flush,
  enet_host_service,
};
