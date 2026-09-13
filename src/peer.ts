import koffi from "koffi";

import {
  enetAddress,
  enetPeer,
  enet_peer_disconnect,
  enet_peer_reset,
  enet_peer_send,
} from "./native/index.js";
import type { NativePointer } from "./native/pointers.js";
import type { IENetAddress, IENetPacket, IENetPeer } from "./structs.js";
import { nativePointer } from "./structs.js";
import type { HandlePrototype } from "./util.js";
import { createHandle, ipFromLong, readNumber } from "./util.js";

const ADDRESS_OFFSET = koffi.offsetof(enetPeer, "address");
const HOST_OFFSET = ADDRESS_OFFSET + koffi.offsetof(enetAddress, "host");
const PORT_OFFSET = ADDRESS_OFFSET + koffi.offsetof(enetAddress, "port");
const MTU_OFFSET = koffi.offsetof(enetPeer, "mtu");

const peerPrototype: HandlePrototype<IENetPeer> = {
  get address(): IENetAddress {
    const pointer = this[nativePointer];

    return {
      host: ipFromLong(readNumber(pointer, HOST_OFFSET, "uint32")),
      port: readNumber(pointer, PORT_OFFSET, "uint16"),
    };
  },
  get mtu(): number {
    return readNumber(this[nativePointer], MTU_OFFSET, "uint16");
  },
};

const wrapPeer = (pointer: NativePointer<"ENetPeer">): IENetPeer =>
  createHandle<IENetPeer>(peerPrototype, pointer);

const disconnect = (peer: IENetPeer, data: number): void => {
  enet_peer_disconnect(peer[nativePointer], data);
};

const reset = (peer: IENetPeer): void => {
  enet_peer_reset(peer[nativePointer]);
};

const send = (
  peer: IENetPeer,
  channelID: number,
  packet: IENetPacket,
): number =>
  enet_peer_send(peer[nativePointer], channelID, packet[nativePointer]);

export { disconnect, reset, send, wrapPeer };
