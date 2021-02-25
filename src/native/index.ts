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

interface INativeFunctions {
  enet_host_create: (
    address: Buffer,
    peerCount: number,
    incomingBandwidth: number,
    outgoingBandwidth: number
  ) => Buffer;
  enet_host_service: (host: Buffer, event: Buffer, timeout: number) => number;
  enet_initialize: () => number;
  enet_packet_create: (
    data: Buffer,
    dataLength: number,
    flags: number
  ) => Buffer;
  enet_peer_send: (peer: Buffer, channelID: number, packet: Buffer) => number;
}

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

const nativeFunctions: INativeFunctions = ffi.Library(enetLibPath, {
  enet_host_create: [
    ref.refType(enetHost),
    [ref.refType(enetAddress), ref.types.size_t, enetUint32, enetUint32],
  ],
  enet_host_service: [
    ref.types.int,
    [ref.refType(enetHost), ref.refType(enetEvent), enetUint32],
  ],
  enet_initialize: [ref.types.int, []],
  enet_packet_create: [
    ref.refType(enetPacket),
    [ref.refType(ref.types.void), ref.types.size_t, enetUint32],
  ],
  enet_peer_send: [
    ref.types.int,
    [ref.refType(enetPeer), enetUint8, ref.refType(enetPacket)],
  ],
}) as INativeFunctions;

export = nativeFunctions;
