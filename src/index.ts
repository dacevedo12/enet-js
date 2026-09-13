import { getHost, getHostIp, setHost, setHostIp } from "./address.js";
import { compress, compressWithRangeCoder } from "./compressor.js";
import {
  deinitialize,
  initialize,
  initializeWithCallbacks,
  linkedVersion,
} from "./global.js";
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
  pingInterval,
  receive,
  reset,
  send,
  throttleConfigure,
  timeout,
} from "./peer.js";
import {
  compress as compressRange,
  create as createRangeCoder,
  decompress as decompressRange,
  destroy as destroyRangeCoder,
} from "./range-coder.js";
import {
  accept,
  bind,
  connect as connectSocket,
  create as createSocket,
  destroy as destroySocket,
  getAddress,
  getOption,
  listen,
  receive as receiveSocket,
  send as sendSocket,
  setOption,
  shutdown,
  wait,
} from "./socket.js";
import { select } from "./socketset.js";
import { get as getTime, set as setTime } from "./time.js";

interface IENet {
  readonly address: {
    readonly getHost: typeof getHost;
    readonly getHostIp: typeof getHostIp;
    readonly setHost: typeof setHost;
    readonly setHostIp: typeof setHostIp;
  };
  readonly crc32: typeof crc32;
  readonly deinitialize: typeof deinitialize;
  readonly host: {
    readonly bandwidthLimit: typeof bandwidthLimit;
    readonly broadcast: typeof broadcast;
    readonly channelLimit: typeof channelLimit;
    readonly checkEvents: typeof checkEvents;
    readonly compress: typeof compress;
    readonly compressWithRangeCoder: typeof compressWithRangeCoder;
    readonly connect: typeof connect;
    readonly create: typeof createHost;
    readonly destroy: typeof destroyHost;
    readonly flush: typeof flush;
    readonly service: typeof service;
  };
  readonly initialize: typeof initialize;
  readonly initializeWithCallbacks: typeof initializeWithCallbacks;
  readonly linkedVersion: typeof linkedVersion;
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
    readonly pingInterval: typeof pingInterval;
    readonly receive: typeof receive;
    readonly reset: typeof reset;
    readonly send: typeof send;
    readonly throttleConfigure: typeof throttleConfigure;
    readonly timeout: typeof timeout;
  };
  readonly rangeCoder: {
    readonly compress: typeof compressRange;
    readonly create: typeof createRangeCoder;
    readonly decompress: typeof decompressRange;
    readonly destroy: typeof destroyRangeCoder;
  };
  readonly socket: {
    readonly accept: typeof accept;
    readonly bind: typeof bind;
    readonly connect: typeof connectSocket;
    readonly create: typeof createSocket;
    readonly destroy: typeof destroySocket;
    readonly getAddress: typeof getAddress;
    readonly getOption: typeof getOption;
    readonly listen: typeof listen;
    readonly receive: typeof receiveSocket;
    readonly send: typeof sendSocket;
    readonly setOption: typeof setOption;
    readonly shutdown: typeof shutdown;
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
  address: { getHost, getHostIp, setHost, setHostIp },
  crc32,
  deinitialize,
  host: {
    bandwidthLimit,
    broadcast,
    channelLimit,
    checkEvents,
    compress,
    compressWithRangeCoder,
    connect,
    create: createHost,
    destroy: destroyHost,
    flush,
    service,
  },
  initialize,
  initializeWithCallbacks,
  linkedVersion,
  packet: { create: createPacket, destroy: destroyPacket, resize },
  peer: {
    disconnect,
    disconnectLater,
    disconnectNow,
    ping,
    pingInterval,
    receive,
    reset,
    send,
    throttleConfigure,
    timeout,
  },
  rangeCoder: {
    compress: compressRange,
    create: createRangeCoder,
    decompress: decompressRange,
    destroy: destroyRangeCoder,
  },
  socket: {
    accept,
    bind,
    connect: connectSocket,
    create: createSocket,
    destroy: destroySocket,
    getAddress,
    getOption,
    listen,
    receive: receiveSocket,
    send: sendSocket,
    setOption,
    shutdown,
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
