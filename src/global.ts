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

/**
 * Like enet_initialize_with_callbacks, where only `noMemory` can be set, so
 * ENet keeps its own `malloc` and `free`. Once ENet accepts the callbacks, it
 * keeps `noMemory` for the rest of the process.
 *
 * @param version - The ENet version the program was written against, from
 * `ENET_VERSION_CREATE`.
 * @param inits - The callbacks.
 * @returns 0 on success, or -1 on failure.
 */
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
