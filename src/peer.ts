import type { IENetPacket, IENetPeer } from "./enet";
import { enet_peer_send } from "./native";

export const send = (
  peer: IENetPeer,
  channelID: number,
  packet: IENetPacket
): number => enet_peer_send(peer.native, channelID, packet.native);
