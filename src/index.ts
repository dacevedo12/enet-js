import * as global from "./global.js";
import * as host from "./host.js";
import * as packet from "./packet.js";
import * as peer from "./peer.js";

const enet = {
  ...global,
  host,
  packet,
  peer,
};

export * from "./constants.js";
export * from "./enums.js";
export type * from "./structs.js";
export { enet };
