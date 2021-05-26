import { enet_peer_send } from "./native";
import type { IENetPacket, IENetPeer } from "./structs";

const send = (
  peer: IENetPeer,
  channelID: number,
  packet: IENetPacket
): number => enet_peer_send(peer.native, channelID, packet.native);

export { send };
