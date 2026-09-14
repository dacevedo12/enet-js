import koffi from "koffi";

import { guardCallback, guardVoidCallback } from "./callbacks.js";
import type { NativeCallbacks } from "./native/index.js";
import {
  enetNoMemoryCallback,
  enetRandCallback,
  enet_deinitialize,
  enet_initialize,
  enet_initialize_with_callbacks,
} from "./native/index.js";
import type { IENetCallbacks } from "./structs.js";

const SUCCESS = 0;
const RAND_FAILURE = 0;

const deinitialize = (): void => {
  enet_deinitialize();
};

const initialize = (): number => enet_initialize();

// ENet keeps its own malloc and free, and keeps noMemory and rand for the rest of the process once it accepts the callbacks
const initializeWithCallbacks = (
  version: number,
  inits: IENetCallbacks,
): number => {
  const { noMemory, rand } = inits;
  const callbacks: NativeCallbacks = {
    free: null,
    malloc: null,
    no_memory:
      noMemory === undefined
        ? null
        : koffi.register(() => {
            guardVoidCallback(noMemory);
          }, enetNoMemoryCallback),
    rand:
      rand === undefined
        ? null
        : koffi.register(
            (): number => guardCallback(RAND_FAILURE, rand),
            enetRandCallback,
          ),
  };
  const result = enet_initialize_with_callbacks(version, callbacks);

  if (result < SUCCESS) {
    for (const address of [callbacks.no_memory, callbacks.rand]) {
      if (address !== null) {
        koffi.unregister(address);
      }
    }
  }

  return result;
};

export { deinitialize, initialize, initializeWithCallbacks };
