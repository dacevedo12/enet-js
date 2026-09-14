import type { KoffiFunc } from "koffi";

import { lib } from "./library.js";
import type { NativePointer } from "./pointers.js";

const enet_peer_send: KoffiFunc<
  (
    peer: NativePointer<"ENetPeer">,
    channelID: number,
    packet: NativePointer<"ENetPacket">,
  ) => number
> = lib.func(
  "int enet_peer_send(ENetPeer *peer, uint8 channelID, ENetPacket *packet)",
);
const enet_peer_receive: KoffiFunc<
  (
    peer: NativePointer<"ENetPeer">,
    channelID: readonly [number],
  ) => NativePointer<"ENetPacket"> | null
> = lib.func(
  "ENetPacket *enet_peer_receive(ENetPeer *peer, _Out_ uint8 *channelID)",
);
const enet_peer_ping: KoffiFunc<
  (peer: NativePointer<"ENetPeer">) => undefined
> = lib.func("void enet_peer_ping(ENetPeer *peer)");
const enet_peer_reset: KoffiFunc<
  (peer: NativePointer<"ENetPeer">) => undefined
> = lib.func("void enet_peer_reset(ENetPeer *peer)");
const enet_peer_disconnect: KoffiFunc<
  (peer: NativePointer<"ENetPeer">, data: number) => undefined
> = lib.func("void enet_peer_disconnect(ENetPeer *peer, uint32 data)");
const enet_peer_disconnect_now: KoffiFunc<
  (peer: NativePointer<"ENetPeer">, data: number) => undefined
> = lib.func("void enet_peer_disconnect_now(ENetPeer *peer, uint32 data)");
const enet_peer_disconnect_later: KoffiFunc<
  (peer: NativePointer<"ENetPeer">, data: number) => undefined
> = lib.func("void enet_peer_disconnect_later(ENetPeer *peer, uint32 data)");
const enet_peer_throttle_configure: KoffiFunc<
  (
    peer: NativePointer<"ENetPeer">,
    interval: number,
    acceleration: number,
    deceleration: number,
  ) => undefined
> = lib.func(
  "void enet_peer_throttle_configure(ENetPeer *peer, uint32 interval, uint32 acceleration, uint32 deceleration)",
);

export {
  enet_peer_disconnect,
  enet_peer_disconnect_later,
  enet_peer_disconnect_now,
  enet_peer_ping,
  enet_peer_receive,
  enet_peer_reset,
  enet_peer_send,
  enet_peer_throttle_configure,
};
