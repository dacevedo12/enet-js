import type { KoffiFunc } from "koffi";

import type { NativeCallbacks } from "./library.js";
import { lib } from "./library.js";

const enet_initialize: KoffiFunc<() => number> = lib.func(
  "int enet_initialize()",
);
const enet_initialize_with_callbacks: KoffiFunc<
  (version: number, inits: NativeCallbacks) => number
> = lib.func(
  "int enet_initialize_with_callbacks(uint32 version, const ENetCallbacks *inits)",
);
const enet_deinitialize: KoffiFunc<() => undefined> = lib.func(
  "void enet_deinitialize()",
);
const enet_linked_version: KoffiFunc<() => number> = lib.func(
  "uint32 enet_linked_version()",
);
const enet_time_get: KoffiFunc<() => number> = lib.func(
  "uint32 enet_time_get()",
);
const enet_time_set: KoffiFunc<(time: number) => undefined> = lib.func(
  "void enet_time_set(uint32 time)",
);

export {
  enet_deinitialize,
  enet_initialize,
  enet_initialize_with_callbacks,
  enet_linked_version,
  enet_time_get,
  enet_time_set,
};
