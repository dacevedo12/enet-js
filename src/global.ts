import koffi from "koffi";

import { guardVoidCallback } from "./callbacks.js";
import {
  enetNoMemoryCallback,
  enet_deinitialize,
  enet_initialize,
  enet_initialize_with_callbacks,
  enet_linked_version,
} from "./native/index.js";
import type { IENetCallbacks } from "./structs.js";

const SUCCESS = 0;

const deinitialize = (): void => {
  enet_deinitialize();
};

const initialize = (): number => enet_initialize();

// ENet keeps its own malloc and free, and keeps noMemory for the rest of the process once it accepts the callbacks
const initializeWithCallbacks = (
  version: number,
  inits: IENetCallbacks,
): number => {
  const { noMemory } = inits;
  const noMemoryAddress =
    noMemory === undefined
      ? null
      : koffi.register(() => {
          guardVoidCallback(noMemory);
        }, enetNoMemoryCallback);
  const result = enet_initialize_with_callbacks(version, {
    free: null,
    malloc: null,
    no_memory: noMemoryAddress,
  });

  if (result < SUCCESS && noMemoryAddress !== null) {
    koffi.unregister(noMemoryAddress);
  }

  return result;
};

const linkedVersion = (): number => enet_linked_version();

export { deinitialize, initialize, initializeWithCallbacks, linkedVersion };
