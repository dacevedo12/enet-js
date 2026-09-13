import koffi from "koffi";

import type { NativePointer } from "./native/pointers.js";
import { nativePointer } from "./structs.js";

const IPV4_OCTETS = 4;
const START_OFFSET = 0;
const LITTLE_ENDIAN = true;
const SUCCESS = 0;

const ipToLong = (ip: string): number => {
  const view = new DataView(new ArrayBuffer(IPV4_OCTETS));

  for (const [index, octet] of ip.split(".").entries()) {
    view.setUint8(index, Number(octet));
  }

  return view.getUint32(START_OFFSET, LITTLE_ENDIAN);
};

const ipFromLong = (ipLong: number): string => {
  const view = new DataView(new ArrayBuffer(IPV4_OCTETS));

  view.setUint32(START_OFFSET, ipLong, LITTLE_ENDIAN);

  return new Uint8Array(view.buffer).join(".");
};

const nonNull = <Value>(
  value: Value | null | undefined,
  message: string,
): Value => {
  if (value === null || value === undefined) {
    throw new Error(message);
  }

  return value;
};

// C functions that fill an out-parameter return a negative status on failure
const outValue = <Value>(status: number, value: () => Value): Value | null =>
  status < SUCCESS ? null : value();

// Koffi decodes the value at the offset as the named C type
const readNumber = (
  memory: Buffer | bigint,
  offset: number,
  type: string,
): number => {
  const value: unknown = koffi.decode(memory, offset, type);

  return Number(value);
};

const writeNumber = (
  pointer: bigint,
  offset: number,
  type: string,
  value: number,
): void => {
  koffi.encode(pointer, offset, type, value);
};

const readPointer = <Type extends string>(
  pointer: bigint,
  offset: number,
): NativePointer<Type> | null => {
  const value: unknown = koffi.decode(pointer, offset, "void *");

  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- Koffi decodes a pointer as a bigint, or null for NULL, and the brand only exists at compile time
  return value as NativePointer<Type> | null;
};

// Like &array[index] in C
const elementPointer = <Type extends string>(
  array: bigint,
  index: number,
  size: number,
): NativePointer<Type> =>
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- an element pointer has the array's element type, and the brand only exists at compile time
  (array + BigInt(index * size)) as NativePointer<Type>;

// The fields a handle reads from its struct, shared by every handle of that type
type HandlePrototype<
  Handle,
  Slots extends keyof Handle = never,
> = ThisType<Handle> & Omit<Handle, typeof nativePointer | Slots>;

// A handle keeps its pointer in a hidden property and JS-only fields in own properties
const createHandle = <
  Handle extends { readonly [nativePointer]: bigint },
  Slots extends keyof Handle = never,
>(
  prototype: HandlePrototype<Handle, Slots>,
  pointer: Handle[typeof nativePointer],
  slots: Pick<Handle, Slots>,
): Handle =>
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- the prototype and slots provide every field of Handle but the pointer
  Object.assign(
    Object.create(prototype, { [nativePointer]: { value: pointer } }),
    slots,
  ) as Handle;

export type { HandlePrototype };
export {
  createHandle,
  elementPointer,
  ipFromLong,
  ipToLong,
  nonNull,
  outValue,
  readNumber,
  readPointer,
  writeNumber,
};
