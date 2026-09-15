import koffi from "koffi";

import type { NativeBuffer } from "./native/index.js";
import { enetBuffer } from "./native/index.js";
import { elementPointer, readNumber, readPointer } from "./util.js";

const BUFFER_SIZE = koffi.sizeof(enetBuffer);
const DATA_OFFSET = koffi.offsetof(enetBuffer, "data");
const DATA_LENGTH_OFFSET = koffi.offsetof(enetBuffer, "dataLength");

// An ENetBuffer array over the caller's Buffers
const toNativeBuffers = (buffers: readonly Buffer[]): NativeBuffer[] =>
  buffers.map((data) => ({ data, dataLength: data.length }));

// A view of memory ENet handed to a callback
const viewOf = (pointer: bigint | null, length: number): Buffer =>
  Buffer.from(koffi.view(pointer, length));

// Views of an ENetBuffer array ENet handed to a callback
const fromNativeBuffers = (buffers: bigint, count: number): Buffer[] =>
  Array.from({ length: count }, (_element, index) => {
    const buffer = elementPointer<"ENetBuffer">(buffers, index, BUFFER_SIZE);
    const length = readNumber(buffer, DATA_LENGTH_OFFSET, "size_t");

    return viewOf(readPointer(buffer, DATA_OFFSET), length);
  });

export { fromNativeBuffers, toNativeBuffers, viewOf };
