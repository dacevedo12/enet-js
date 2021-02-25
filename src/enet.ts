import * as host from "./host";
import { enet_initialize } from "./native";
import * as packet from "./packet";
import * as peer from "./peer";

const ENET_HOST_ANY = "0.0.0.0";

const initialize = (): number => enet_initialize();

const enet = {
  host,
  initialize,
  packet,
  peer,
};

export * from "./enums";
export * from "./structs";
export { ENET_HOST_ANY, enet };
