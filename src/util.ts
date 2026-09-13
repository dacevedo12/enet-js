import koffi from "koffi";

import { nativePointer } from "./structs.js";

const IPV4_OCTETS = 4;
const START_OFFSET = 0;
const LITTLE_ENDIAN = true;

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

const nonNull = <Value>(value: Value | null, message: string): Value => {
  if (value === null) {
    throw new Error(message);
  }

  return value;
};

// Koffi decodes the value at the offset as the named C type
const readNumber = (pointer: bigint, offset: number, type: string): number => {
  const value: unknown = koffi.decode(pointer, offset, type);

  return Number(value);
};

// The fields a handle reads from its struct, shared by every handle of that type
type HandlePrototype<Handle> = ThisType<Handle> &
  Omit<Handle, typeof nativePointer>;

const createHandle = <Handle extends { readonly [nativePointer]: bigint }>(
  prototype: HandlePrototype<Handle>,
  pointer: Handle[typeof nativePointer],
): Handle =>
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- the prototype provides every field of Handle but the pointer
  Object.create(prototype, { [nativePointer]: { value: pointer } }) as Handle;

export type { HandlePrototype };
export { createHandle, ipFromLong, ipToLong, nonNull, readNumber };
