import * as host from "./host";
import * as packet from "./packet";
import * as peer from "./peer";
import { enet_initialize } from "./native";

export const ENET_HOST_ANY = "0.0.0.0";

const initialize = (): number => enet_initialize();

export const enet = {
  host,
  initialize,
  packet,
  peer,
};

export * from "./enums";
export * from "./structs";
