/* eslint-disable @typescript-eslint/naming-convention */
import koffi from "koffi";

import {
  enetAddress,
  enetEvent,
  enetHost,
  enetPacket,
  enetPeer,
} from "./structs.js";

const enetLibPath = process.env.ENET_LIB_PATH;

if (enetLibPath === undefined) {
  throw Error(
    "ENET_LIB_PATH is not set; set it to the full path of the ENet shared library",
  );
}

const lib = koffi.load(enetLibPath);

const enet_initialize = lib.func("int enet_initialize()");
const enet_deinitialize = lib.func("void enet_deinitialize()");
const enet_host_create = lib.func(
  "ENetHost *enet_host_create(ENetAddress *address, size_t peerCount, size_t channelLimit, uint32 incomingBandwidth, uint32 outgoingBandwidth)",
);
const enet_host_destroy = lib.func("void enet_host_destroy(ENetHost *host)");
const enet_host_connect = lib.func(
  "ENetPeer *enet_host_connect(ENetHost *host, ENetAddress *address, size_t channelCount, uint32 data)",
);
const enet_host_service = lib.func(
  "int enet_host_service(ENetHost *host, _Out_ ENetEvent *event, uint32 timeout)",
);
const enet_host_flush = lib.func("void enet_host_flush(ENetHost *host)");
const enet_host_broadcast = lib.func(
  "void enet_host_broadcast(ENetHost *host, uint8 channelID, ENetPacket *packet)",
);
const enet_packet_create = lib.func(
  "ENetPacket *enet_packet_create(void *data, size_t dataLength, uint32 flags)",
);
const enet_packet_destroy = lib.func(
  "void enet_packet_destroy(ENetPacket *packet)",
);
const enet_peer_send = lib.func(
  "int enet_peer_send(ENetPeer *peer, uint8 channelID, ENetPacket *packet)",
);
const enet_peer_disconnect = lib.func(
  "void enet_peer_disconnect(ENetPeer *peer, uint32 data)",
);
const enet_peer_reset = lib.func("void enet_peer_reset(ENetPeer *peer)");

export {
  enetAddress,
  enetEvent,
  enetHost,
  enetPacket,
  enetPeer,
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
