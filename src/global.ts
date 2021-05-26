import { enet_initialize } from "./native";

const initialize = (): number => enet_initialize();

export { initialize };
