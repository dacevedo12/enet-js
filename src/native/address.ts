import type { KoffiFunc } from "koffi";

import type { NativeAddress } from "./library.js";
import { lib } from "./library.js";

const enet_address_set_host: KoffiFunc<
  (address: NativeAddress, hostName: string) => number
> = lib.func(
  "int enet_address_set_host(_Inout_ ENetAddress *address, const char *hostName)",
);
const enet_address_get_host_ip: KoffiFunc<
  (address: NativeAddress, hostName: Buffer, nameLength: number) => number
> = lib.func(
  "int enet_address_get_host_ip(const ENetAddress *address, char *hostName, size_t nameLength)",
);
const enet_address_get_host: KoffiFunc<
  (address: NativeAddress, hostName: Buffer, nameLength: number) => number
> = lib.func(
  "int enet_address_get_host(const ENetAddress *address, char *hostName, size_t nameLength)",
);

export {
  enet_address_get_host,
  enet_address_get_host_ip,
  enet_address_set_host,
};
