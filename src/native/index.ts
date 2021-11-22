/* eslint "camelcase": ["error", { "allow": ["enet_*"] }] */
/* eslint "@typescript-eslint/naming-convention": [
    "error",
    { "format": ["snake_case"], "selector": "property" }
  ]
*/
import fs from "fs";
import path from "path";

import ffi from "ffi-napi";
import ref from "ref-napi";

import {
  enetAddress,
  enetEvent,
  enetHost,
  enetPacket,
  enetPeer,
  enetUint32,
  enetUint8,
} from "./structs";

const { enetLibPath } = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "package.json"), {
    encoding: "utf8",
  })
) as Record<string, string>;

if (!enetLibPath) {
  throw Error(
    "ENet binary not found, make sure to set the 'enetLibPath' property in " +
      "your package.json"
  );
}

const nullable = <T>(pointer: T): ref.Type<ref.Value<null>> | T =>
  pointer as ref.Type<ref.Value<null>> | T;

const nativeFunctions = ffi.Library(enetLibPath, {
  enet_deinitialize: [ref.types.void, []],
  enet_host_broadcast: [
    ref.types.void,
    [ref.refType(enetHost), enetUint8, ref.refType(enetPacket)],
  ],
  enet_host_create: [
    ref.refType(enetHost),
    [
      nullable(ref.refType(enetAddress)),
      ref.types.size_t,
      enetUint32,
      enetUint32,
    ],
  ],
  enet_host_destroy: [ref.types.void, [ref.refType(enetHost)]],
  enet_host_flush: [ref.types.void, [ref.refType(enetHost)]],
  enet_host_service: [
    ref.types.int,
    [ref.refType(enetHost), ref.refType(enetEvent), enetUint32],
  ],
  enet_initialize: [ref.types.int, []],
  enet_packet_create: [
    ref.refType(enetPacket),
    [ref.refType(ref.types.void), ref.types.size_t, enetUint32],
  ],
  enet_packet_destroy: [ref.types.void, [ref.refType(enetPacket)]],
  enet_peer_disconnect: [ref.types.void, [ref.refType(enetPeer), enetUint32]],
  enet_peer_reset: [ref.types.void, [ref.refType(enetPeer)]],
  enet_peer_send: [
    ref.types.int,
    [ref.refType(enetPeer), enetUint8, ref.refType(enetPacket)],
  ],
});

export = nativeFunctions;
