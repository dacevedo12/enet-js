import { enet_deinitialize, enet_initialize } from "./native/index.js";

const deinitialize = (): void => {
  enet_deinitialize();
};
const initialize = (): number => enet_initialize();

export { deinitialize, initialize };
