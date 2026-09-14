import {
  emptyNativeAddress,
  fromNativeAddress,
  toNativeAddress,
  toNativeAddressOrNull,
} from "./address.js";
import { toNativeBuffers } from "./buffers.js";
import { ENET_SOCKET_NULL } from "./constants.js";
import type {
  ENetSocketOption,
  ENetSocketShutdown,
  ENetSocketType,
} from "./enums.js";
import {
  enet_socket_accept,
  enet_socket_bind,
  enet_socket_connect,
  enet_socket_create,
  enet_socket_destroy,
  enet_socket_get_address,
  enet_socket_get_option,
  enet_socket_listen,
  enet_socket_receive,
  enet_socket_send,
  enet_socket_set_option,
  enet_socket_shutdown,
  enet_socket_wait,
} from "./native/index.js";
import type {
  IENetAddress,
  IENetSocketAccept,
  IENetSocketReceive,
} from "./structs.js";
import { outValue } from "./util.js";

const UNSET = 0;
const NOTHING_RECEIVED = 0;

const create = (type: ENetSocketType): number => enet_socket_create(type);

const bind = (socket: number, address: IENetAddress | null): number =>
  enet_socket_bind(socket, toNativeAddressOrNull(address));

// Like enet_socket_get_address, returning the address instead of filling it in
const getAddress = (socket: number): IENetAddress | null => {
  const address = emptyNativeAddress();

  return outValue(enet_socket_get_address(socket, address), () =>
    fromNativeAddress(address),
  );
};

const listen = (socket: number, backlog: number): number =>
  enet_socket_listen(socket, backlog);

// Like enet_socket_accept, returning the peer's address with the new socket
const accept = (socket: number): IENetSocketAccept | null => {
  const address = emptyNativeAddress();
  const accepted = enet_socket_accept(socket, address);

  return accepted === ENET_SOCKET_NULL
    ? null
    : { address: fromNativeAddress(address), socket: accepted };
};

const connect = (socket: number, address: IENetAddress): number =>
  enet_socket_connect(socket, toNativeAddress(address));

const send = (
  socket: number,
  address: IENetAddress | null,
  buffers: readonly Buffer[],
): number =>
  enet_socket_send(
    socket,
    toNativeAddressOrNull(address),
    toNativeBuffers(buffers),
    buffers.length,
  );

// Like enet_socket_receive, returning the sender's address with the result
const receive = (
  socket: number,
  buffers: readonly Buffer[],
): IENetSocketReceive => {
  const address = emptyNativeAddress();
  const result = enet_socket_receive(
    socket,
    address,
    toNativeBuffers(buffers),
    buffers.length,
  );

  // ENet fills in the sender only when it received something
  return {
    address: result > NOTHING_RECEIVED ? fromNativeAddress(address) : null,
    result,
  };
};

// Like enet_socket_wait, returning the ready conditions instead of updating them
const wait = (
  socket: number,
  condition: number,
  timeout: number,
): number | null => {
  const conditions: [number] = [condition];

  return outValue(enet_socket_wait(socket, conditions, timeout), () => {
    const [ready] = conditions;

    return ready;
  });
};

const setOption = (
  socket: number,
  option: ENetSocketOption,
  value: number,
): number => enet_socket_set_option(socket, option, value);

// Like enet_socket_get_option, returning the value instead of filling it in
const getOption = (socket: number, option: ENetSocketOption): number | null => {
  const values: [number] = [UNSET];

  return outValue(enet_socket_get_option(socket, option, values), () => {
    const [value] = values;

    return value;
  });
};

const shutdown = (socket: number, how: ENetSocketShutdown): number =>
  enet_socket_shutdown(socket, how);

const destroy = (socket: number): void => {
  enet_socket_destroy(socket);
};

export {
  accept,
  bind,
  connect,
  create,
  destroy,
  getAddress,
  getOption,
  listen,
  receive,
  send,
  setOption,
  shutdown,
  wait,
};
