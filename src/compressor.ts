import koffi from "koffi";

import { fromNativeBuffers, viewOf } from "./buffers.js";
import {
  afterCallbacks,
  guardCallback,
  guardVoidCallback,
} from "./callbacks.js";
import {
  enetCompressCallback,
  enetCompressorDestroyCallback,
  enetDecompressCallback,
  enet_host_compress,
  enet_host_compress_with_range_coder,
} from "./native/index.js";
import type { IENetCompressor, IENetHost } from "./structs.js";
import { nativePointer } from "./structs.js";
import { nonNull } from "./util.js";

type CompressArguments = readonly [
  context: bigint,
  inBuffers: bigint,
  inBufferCount: number,
  inLimit: number,
  outData: bigint,
  outLimit: number,
];

type DecompressArguments = readonly [
  context: bigint,
  inData: bigint,
  inLimit: number,
  outData: bigint,
  outLimit: number,
];

const COMPRESS_FAILURE = 0;
const FIRST_CONTEXT = 0n;
const CONTEXT_STEP = 1n;

// JS compressors by the context ENet passes back to their callbacks
const compressors = new Map<bigint, IENetCompressor>();

const contexts = { last: FIRST_CONTEXT };

const compressorOf = (context: bigint): IENetCompressor =>
  nonNull(
    compressors.get(context),
    "ENet called a compressor callback with an unknown context",
  );

// Registered once and shared by every JS compressor, told apart by their context
const compressAddress = koffi.register(
  (
    ...[
      context,
      inBuffers,
      inBufferCount,
      inLimit,
      outData,
      outLimit,
    ]: CompressArguments
  ): number =>
    guardCallback(COMPRESS_FAILURE, () =>
      compressorOf(context).compress(
        fromNativeBuffers(inBuffers, inBufferCount),
        inLimit,
        viewOf(outData, outLimit),
        outLimit,
      ),
    ),
  enetCompressCallback,
);

const decompressAddress = koffi.register(
  (
    ...[context, inData, inLimit, outData, outLimit]: DecompressArguments
  ): number =>
    guardCallback(COMPRESS_FAILURE, () =>
      compressorOf(context).decompress(
        viewOf(inData, inLimit),
        inLimit,
        viewOf(outData, outLimit),
        outLimit,
      ),
    ),
  enetDecompressCallback,
);

const destroyAddress = koffi.register((context: bigint): void => {
  guardVoidCallback(() => {
    const compressor = compressorOf(context);

    compressors.delete(context);
    compressor.destroy?.();
  });
}, enetCompressorDestroyCallback);

// Like enet_host_compress, with the JS compressor's callbacks behind shared native ones
const compress = (
  host: IENetHost,
  compressor: IENetCompressor | null,
): void => {
  afterCallbacks(() => {
    if (compressor === null) {
      enet_host_compress(host[nativePointer], null);
    } else {
      contexts.last += CONTEXT_STEP;
      compressors.set(contexts.last, compressor);
      enet_host_compress(host[nativePointer], {
        compress: compressAddress,
        context: contexts.last,
        decompress: decompressAddress,
        destroy: destroyAddress,
      });
    }
  });
};

const compressWithRangeCoder = (host: IENetHost): number =>
  afterCallbacks(() =>
    enet_host_compress_with_range_coder(host[nativePointer]),
  );

export { compress, compressWithRangeCoder };
