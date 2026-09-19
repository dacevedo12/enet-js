import {
  emptyNativeAddress,
  fromNativeAddress,
  toNativeAddress,
  toNativeAddressOrNull,
} from "./address.js";
import { toNativeBuffers } from "./buffers.js";
import { ENET_SOCKET_NULL } from "./constants.js";
import type { ENetSocketOption, ENetSocketType } from "./enums.js";
import {
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
} from "./native/index.js";
import type {
  IENetAddress,
  IENetSocketAccept,
  IENetSocketReceive,
} from "./structs.js";
import { outValue } from "./util.js";

const NOTHING_RECEIVED = 0;

const create = (type: ENetSocketType): number => enet_socket_create(type);

const bind = (socket: number, address: IENetAddress | null): number =>
  enet_socket_bind(socket, toNativeAddressOrNull(address));

const listen = (socket: number, backlog: number): number =>
  enet_socket_listen(socket, backlog);

/**
 * Like enet_socket_accept, returning the peer's address with the new socket
 * instead of filling it in.
 *
 * @param socket - The listening socket.
 * @returns The new socket and the peer's address, or `null` on failure.
 */
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

/**
 * Like enet_socket_receive, returning the sender's address with the result
 * instead of filling it in. The datagram is written into `buffers`.
 *
 * @param socket - The socket to receive from.
 * @param buffers - Where to write the datagram.
 * @returns ENet's result, with the sender's address if it received anything,
 * or `null` otherwise.
 */
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

/**
 * Like enet_socket_wait, returning the conditions that are ready instead of
 * updating `condition`.
 *
 * @param socket - The socket to wait on.
 * @param condition - Bitwise OR of the `ENetSocketWait` conditions to wait
 * for.
 * @param timeout - How long to wait, in milliseconds.
 * @returns Bitwise OR of the conditions that are ready, or `null` on failure.
 */
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

const destroy = (socket: number): void => {
  enet_socket_destroy(socket);
};

export {
  accept,
  bind,
  connect,
  create,
  destroy,
  listen,
  receive,
  send,
  setOption,
  wait,
};
