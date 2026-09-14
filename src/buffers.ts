import type { NativeBuffer } from "./native/index.js";

// An ENetBuffer array over the caller's Buffers
const toNativeBuffers = (buffers: readonly Buffer[]): NativeBuffer[] =>
  buffers.map((data) => ({ data, dataLength: data.length }));

export { toNativeBuffers };
