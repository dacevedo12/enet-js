import { getHost, getHostIp, setHost } from "./address.js";
import { deinitialize, initialize, initializeWithCallbacks } from "./global.js";
import {
  bandwidthLimit,
  broadcast,
  channelLimit,
  checkEvents,
  connect,
  create as createHost,
  destroy as destroyHost,
  flush,
  service,
} from "./host.js";
import {
  crc32,
  create as createPacket,
  destroy as destroyPacket,
  resize,
} from "./packet.js";
import {
  disconnect,
  disconnectLater,
  disconnectNow,
  ping,
  receive,
  reset,
  send,
  throttleConfigure,
} from "./peer.js";
import {
  accept,
  bind,
  connect as connectSocket,
  create as createSocket,
  destroy as destroySocket,
  listen,
  receive as receiveSocket,
  send as sendSocket,
  setOption,
  wait,
} from "./socket.js";
import { select } from "./socketset.js";
import { get as getTime, set as setTime } from "./time.js";

interface IENet {
  readonly address: {
    readonly getHost: typeof getHost;
    readonly getHostIp: typeof getHostIp;
    readonly setHost: typeof setHost;
  };
  readonly crc32: typeof crc32;
  readonly deinitialize: typeof deinitialize;
  readonly host: {
    readonly bandwidthLimit: typeof bandwidthLimit;
    readonly broadcast: typeof broadcast;
    readonly channelLimit: typeof channelLimit;
    readonly checkEvents: typeof checkEvents;
    readonly connect: typeof connect;
    readonly create: typeof createHost;
    readonly destroy: typeof destroyHost;
    readonly flush: typeof flush;
    readonly service: typeof service;
  };
  readonly initialize: typeof initialize;
  readonly initializeWithCallbacks: typeof initializeWithCallbacks;
  readonly packet: {
    readonly create: typeof createPacket;
    readonly destroy: typeof destroyPacket;
    readonly resize: typeof resize;
  };
  readonly peer: {
    readonly disconnect: typeof disconnect;
    readonly disconnectLater: typeof disconnectLater;
    readonly disconnectNow: typeof disconnectNow;
    readonly ping: typeof ping;
    readonly receive: typeof receive;
    readonly reset: typeof reset;
    readonly send: typeof send;
    readonly throttleConfigure: typeof throttleConfigure;
  };
  readonly socket: {
    readonly accept: typeof accept;
    readonly bind: typeof bind;
    readonly connect: typeof connectSocket;
    readonly create: typeof createSocket;
    readonly destroy: typeof destroySocket;
    readonly listen: typeof listen;
    readonly receive: typeof receiveSocket;
    readonly send: typeof sendSocket;
    readonly setOption: typeof setOption;
    readonly wait: typeof wait;
  };
  readonly socketset: {
    readonly select: typeof select;
  };
  readonly time: {
    readonly get: typeof getTime;
    readonly set: typeof setTime;
  };
}

const enet: IENet = {
  address: { getHost, getHostIp, setHost },
  crc32,
  deinitialize,
  host: {
    bandwidthLimit,
    broadcast,
    channelLimit,
    checkEvents,
    connect,
    create: createHost,
    destroy: destroyHost,
    flush,
    service,
  },
  initialize,
  initializeWithCallbacks,
  packet: { create: createPacket, destroy: destroyPacket, resize },
  peer: {
    disconnect,
    disconnectLater,
    disconnectNow,
    ping,
    receive,
    reset,
    send,
    throttleConfigure,
  },
  socket: {
    accept,
    bind,
    connect: connectSocket,
    create: createSocket,
    destroy: destroySocket,
    listen,
    receive: receiveSocket,
    send: sendSocket,
    setOption,
    wait,
  },
  socketset: { select },
  time: { get: getTime, set: setTime },
};

export * from "./constants.js";
export * from "./enums.js";
export * from "./macros.js";
export type * from "./structs.js";
export type { IENet };
export { enet };
