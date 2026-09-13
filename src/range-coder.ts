import { toNativeBuffers } from "./buffers.js";
import { throwCallbackError } from "./callbacks.js";
import {
  enet_range_coder_compress,
  enet_range_coder_create,
  enet_range_coder_decompress,
  enet_range_coder_destroy,
} from "./native/index.js";
import type { IENetRangeCoder } from "./structs.js";
import { nativePointer } from "./structs.js";
import type { HandlePrototype } from "./util.js";
import { createHandle } from "./util.js";

const rangeCoderPrototype: HandlePrototype<IENetRangeCoder> = {};

const create = (): IENetRangeCoder | null => {
  const pointer = enet_range_coder_create();

  throwCallbackError();

  return pointer === null
    ? null
    : createHandle<IENetRangeCoder>(rangeCoderPrototype, pointer, {});
};

const destroy = (rangeCoder: IENetRangeCoder): void => {
  enet_range_coder_destroy(rangeCoder[nativePointer]);
};

const compress = (
  rangeCoder: IENetRangeCoder,
  inBuffers: readonly Buffer[],
  inLimit: number,
  outData: Buffer,
  outLimit: number,
): number =>
  enet_range_coder_compress(
    rangeCoder[nativePointer],
    toNativeBuffers(inBuffers),
    inBuffers.length,
    inLimit,
    outData,
    outLimit,
  );

const decompress = (
  rangeCoder: IENetRangeCoder,
  inData: Buffer,
  inLimit: number,
  outData: Buffer,
  outLimit: number,
): number =>
  enet_range_coder_decompress(
    rangeCoder[nativePointer],
    inData,
    inLimit,
    outData,
    outLimit,
  );

export { compress, create, decompress, destroy };
