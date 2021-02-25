/* eslint "camelcase": ["error", { "allow": ["enet_*"] }] */
/* eslint "@typescript-eslint/naming-convention": [
    "error",
    {
      "custom": { "match": true, "regex": "enet_*" },
      "format": ["snake_case"],
      "selector": "property"
    }
  ]
*/
import {
  enetAddress,
  enetEvent,
  enetHost,
  enetPacket,
  enetPeer,
  enetUint32,
  enetUint8,
} from "./structs";
import ffi from "ffi-napi";
// @ts-expect-error Package json of the project it was installed from
// eslint-disable-next-line import/no-unresolved
import packageJson from "../../../package.json";
import ref from "ref-napi";

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

const binaryPath = (packageJson as Record<string, string>).enetLibPath;

if (!binaryPath) {
  throw Error(
    "ENet binary not found, make sure to set the 'enetLibPath' property in " +
      "your package.json"
  );
}

const nativeFunctions: INativeFunctions = ffi.Library(binaryPath, {
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
