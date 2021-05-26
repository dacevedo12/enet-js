import * as global from "./global";
import * as host from "./host";
import * as packet from "./packet";
import * as peer from "./peer";

const enet = {
  ...global,
  host,
  packet,
  peer,
};

export * from "./enums";
export * from "./structs";
export { enet };
