import type { KoffiFunc } from "koffi";

import type { NativeBuffer } from "./library.js";
import { lib } from "./library.js";
import type { NativePointer } from "./pointers.js";

const enet_range_coder_create: KoffiFunc<
  () => NativePointer<"ENetRangeCoder"> | null
> = lib.func("void *enet_range_coder_create()");
const enet_range_coder_destroy: KoffiFunc<
  (context: NativePointer<"ENetRangeCoder">) => undefined
> = lib.func("void enet_range_coder_destroy(void *context)");
const enet_range_coder_compress: KoffiFunc<
  (
    ...arguments_: readonly [
      context: NativePointer<"ENetRangeCoder">,
      inBuffers: readonly NativeBuffer[],
      inBufferCount: number,
      inLimit: number,
      outData: Buffer,
      outLimit: number,
    ]
  ) => number
> = lib.func(
  "size_t enet_range_coder_compress(void *context, const ENetBuffer *inBuffers, size_t inBufferCount, size_t inLimit, uint8 *outData, size_t outLimit)",
);
const enet_range_coder_decompress: KoffiFunc<
  (
    context: NativePointer<"ENetRangeCoder">,
    inData: Buffer,
    inLimit: number,
    outData: Buffer,
    outLimit: number,
  ) => number
> = lib.func(
  "size_t enet_range_coder_decompress(void *context, const uint8 *inData, size_t inLimit, uint8 *outData, size_t outLimit)",
);

export {
  enet_range_coder_compress,
  enet_range_coder_create,
  enet_range_coder_decompress,
  enet_range_coder_destroy,
};
