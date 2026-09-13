import { enet_time_get, enet_time_set } from "./native/index.js";

const get = (): number => enet_time_get();

const set = (time: number): void => {
  enet_time_set(time);
};

export { get, set };
