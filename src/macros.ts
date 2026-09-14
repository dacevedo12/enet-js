import { ENET_TIME_OVERFLOW } from "./constants.js";

// ENET_VERSION_CREATE packs major, minor and patch into one byte each, from the most significant
const MAJOR_SCALE = 65_536;
const MINOR_SCALE = 256;

// Arithmetic on enet_uint32 wraps modulo 2^32
const UINT32_RANGE = 4_294_967_296;

const ENET_VERSION_CREATE = (
  major: number,
  minor: number,
  patch: number,
): number => major * MAJOR_SCALE + minor * MINOR_SCALE + patch;

const timeSubtract = (left: number, right: number): number =>
  (((left - right) % UINT32_RANGE) + UINT32_RANGE) % UINT32_RANGE;

const ENET_TIME_LESS = (left: number, right: number): boolean =>
  timeSubtract(left, right) >= ENET_TIME_OVERFLOW;

const ENET_TIME_GREATER = (left: number, right: number): boolean =>
  timeSubtract(right, left) >= ENET_TIME_OVERFLOW;

const ENET_TIME_LESS_EQUAL = (left: number, right: number): boolean =>
  !ENET_TIME_GREATER(left, right);

const ENET_TIME_GREATER_EQUAL = (left: number, right: number): boolean =>
  !ENET_TIME_LESS(left, right);

const ENET_TIME_DIFFERENCE = (left: number, right: number): number =>
  ENET_TIME_LESS(left, right)
    ? timeSubtract(right, left)
    : timeSubtract(left, right);

export {
  ENET_TIME_DIFFERENCE,
  ENET_TIME_GREATER,
  ENET_TIME_GREATER_EQUAL,
  ENET_TIME_LESS,
  ENET_TIME_LESS_EQUAL,
  ENET_VERSION_CREATE,
};
