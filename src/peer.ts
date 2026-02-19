import {
  enet_peer_disconnect,
  enet_peer_reset,
  enet_peer_send,
} from "./native/index.js";
import type { IENetPacket, IENetPeer } from "./structs.js";

const disconnect = (peer: IENetPeer, data: number): void => {
  enet_peer_disconnect(peer.native, data);
};

const reset = (peer: IENetPeer): void => {
  enet_peer_reset(peer.native);
};

const send = (
  peer: IENetPeer,
  channelID: number,
  packet: IENetPacket,
): number => enet_peer_send(peer.native, channelID, packet.native) as number;

export { disconnect, reset, send };
