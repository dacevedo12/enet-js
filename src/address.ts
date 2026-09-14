import koffi from "koffi";

import type { NativeAddress } from "./native/index.js";
import {
  enetAddress,
  enet_address_get_host,
  enet_address_get_host_ip,
  enet_address_set_host,
} from "./native/index.js";
import type { IENetAddress } from "./structs.js";
import { ipFromLong, ipToLong, outValue, readNumber } from "./util.js";

// A dotted quad and its terminating NUL
const HOST_IP_LENGTH = 16;
// NI_MAXHOST in netdb.h
const HOST_NAME_LENGTH = 1025;
const NUL = 0;
const START = 0;
const ANY = 0;
const HOST_OFFSET = koffi.offsetof(enetAddress, "host");
const PORT_OFFSET = koffi.offsetof(enetAddress, "port");

const toNativeAddress = (address: IENetAddress): NativeAddress => ({
  host: ipToLong(address.host),
  port: address.port,
});

const toNativeAddressOrNull = (
  address: IENetAddress | null,
): NativeAddress | null => (address === null ? null : toNativeAddress(address));

const fromNativeAddress = (address: NativeAddress): IENetAddress => ({
  host: ipFromLong(address.host),
  port: address.port,
});

// An address for C to fill in through an out-parameter
const emptyNativeAddress = (): NativeAddress => ({ host: ANY, port: ANY });

// Reads an ENetAddress embedded in another struct
const readAddress = (pointer: bigint, offset: number): IENetAddress => ({
  host: ipFromLong(readNumber(pointer, offset + HOST_OFFSET, "uint32")),
  port: readNumber(pointer, offset + PORT_OFFSET, "uint16"),
});

const readHostName = (status: number, hostName: Buffer): string | null =>
  outValue(status, () =>
    hostName.toString("utf8", START, hostName.indexOf(NUL)),
  );

// Like enet_address_set_host, returning the updated address instead of filling it in
const setHost = (
  address: IENetAddress,
  hostName: string,
): IENetAddress | null => {
  const updated = toNativeAddress(address);

  return outValue(enet_address_set_host(updated, hostName), () =>
    fromNativeAddress(updated),
  );
};

const getHostIp = (address: IENetAddress): string | null => {
  const hostName = Buffer.alloc(HOST_IP_LENGTH);

  return readHostName(
    enet_address_get_host_ip(
      toNativeAddress(address),
      hostName,
      hostName.length,
    ),
    hostName,
  );
};

const getHost = (address: IENetAddress): string | null => {
  const hostName = Buffer.alloc(HOST_NAME_LENGTH);

  return readHostName(
    enet_address_get_host(toNativeAddress(address), hostName, hostName.length),
    hostName,
  );
};

export {
  emptyNativeAddress,
  fromNativeAddress,
  getHost,
  getHostIp,
  readAddress,
  readHostName,
  setHost,
  toNativeAddress,
  toNativeAddressOrNull,
};
