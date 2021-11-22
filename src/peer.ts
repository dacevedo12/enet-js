import { enet_peer_disconnect, enet_peer_send } from "./native";
import type { IENetPacket, IENetPeer } from "./structs";

const disconnect = (peer: IENetPeer, data: number): void => {
  enet_peer_disconnect(peer.native, data);
};

const send = (
  peer: IENetPeer,
  channelID: number,
  packet: IENetPacket
): number => enet_peer_send(peer.native, channelID, packet.native);

export { disconnect, send };
