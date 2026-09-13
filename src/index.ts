import { deinitialize, initialize } from "./global.js";
import {
  broadcast,
  connect,
  create as createHost,
  destroy as destroyHost,
  flush,
  service,
} from "./host.js";
import { create as createPacket, destroy as destroyPacket } from "./packet.js";
import { disconnect, reset, send } from "./peer.js";

interface IENet {
  readonly deinitialize: typeof deinitialize;
  readonly host: {
    readonly broadcast: typeof broadcast;
    readonly connect: typeof connect;
    readonly create: typeof createHost;
    readonly destroy: typeof destroyHost;
    readonly flush: typeof flush;
    readonly service: typeof service;
  };
  readonly initialize: typeof initialize;
  readonly packet: {
    readonly create: typeof createPacket;
    readonly destroy: typeof destroyPacket;
  };
  readonly peer: {
    readonly disconnect: typeof disconnect;
    readonly reset: typeof reset;
    readonly send: typeof send;
  };
}

const enet: IENet = {
  deinitialize,
  host: {
    broadcast,
    connect,
    create: createHost,
    destroy: destroyHost,
    flush,
    service,
  },
  initialize,
  packet: { create: createPacket, destroy: destroyPacket },
  peer: { disconnect, reset, send },
};

export * from "./constants.js";
export * from "./enums.js";
export type * from "./structs.js";
export type { IENet };
export { enet };
