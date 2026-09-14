import type { KoffiFunc } from "koffi";

import type { NativeAddress, NativeBuffer } from "./library.js";
import { lib } from "./library.js";

const enet_socket_create: KoffiFunc<(type: number) => number> = lib.func(
  "ENetSocket enet_socket_create(int type)",
);
const enet_socket_bind: KoffiFunc<
  (socket: number, address: NativeAddress | null) => number
> = lib.func(
  "int enet_socket_bind(ENetSocket socket, const ENetAddress *address)",
);
const enet_socket_listen: KoffiFunc<
  (socket: number, backlog: number) => number
> = lib.func("int enet_socket_listen(ENetSocket socket, int backlog)");
const enet_socket_accept: KoffiFunc<
  (socket: number, address: NativeAddress) => number
> = lib.func(
  "ENetSocket enet_socket_accept(ENetSocket socket, _Out_ ENetAddress *address)",
);
const enet_socket_connect: KoffiFunc<
  (socket: number, address: NativeAddress) => number
> = lib.func(
  "int enet_socket_connect(ENetSocket socket, const ENetAddress *address)",
);
const enet_socket_send: KoffiFunc<
  (
    socket: number,
    address: NativeAddress | null,
    buffers: readonly NativeBuffer[],
    bufferCount: number,
  ) => number
> = lib.func(
  "int enet_socket_send(ENetSocket socket, const ENetAddress *address, const ENetBuffer *buffers, size_t bufferCount)",
);
const enet_socket_receive: KoffiFunc<
  (
    socket: number,
    address: NativeAddress,
    buffers: readonly NativeBuffer[],
    bufferCount: number,
  ) => number
> = lib.func(
  "int enet_socket_receive(ENetSocket socket, _Out_ ENetAddress *address, ENetBuffer *buffers, size_t bufferCount)",
);
const enet_socket_wait: KoffiFunc<
  (socket: number, condition: readonly [number], timeout: number) => number
> = lib.func(
  "int enet_socket_wait(ENetSocket socket, _Inout_ uint32 *condition, uint32 timeout)",
);
const enet_socket_set_option: KoffiFunc<
  (socket: number, option: number, value: number) => number
> = lib.func(
  "int enet_socket_set_option(ENetSocket socket, int option, int value)",
);
const enet_socket_destroy: KoffiFunc<(socket: number) => undefined> = lib.func(
  "void enet_socket_destroy(ENetSocket socket)",
);
const enet_socketset_select: KoffiFunc<
  (
    maxSocket: number,
    readSet: Buffer | null,
    writeSet: Buffer | null,
    timeout: number,
  ) => number
> = lib.func(
  "int enet_socketset_select(ENetSocket maxSocket, void *readSet, void *writeSet, uint32 timeout)",
);

export {
  enet_socket_accept,
  enet_socket_bind,
  enet_socket_connect,
  enet_socket_create,
  enet_socket_destroy,
  enet_socket_listen,
  enet_socket_receive,
  enet_socket_send,
  enet_socket_set_option,
  enet_socket_wait,
  enet_socketset_select,
};
