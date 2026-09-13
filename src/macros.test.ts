import { describe, expect, it, vi } from "vitest";

import {
  ENET_TIME_DIFFERENCE,
  ENET_TIME_GREATER,
  ENET_TIME_GREATER_EQUAL,
  ENET_TIME_LESS,
  ENET_TIME_LESS_EQUAL,
  ENET_VERSION,
  ENET_VERSION_CREATE,
  ENET_VERSION_GET_MAJOR,
  ENET_VERSION_GET_MINOR,
  ENET_VERSION_GET_PATCH,
  ENET_VERSION_MAJOR,
  ENET_VERSION_MINOR,
  ENET_VERSION_PATCH,
} from "./index.js";

vi.setConfig({ testTimeout: 10_000 });

const EARLIER = 1000;
const LATER = 3000;
const GAP = 2000;
const LAST_UINT32 = 4_294_967_295;
const AFTER_WRAP = 1;
const WRAPPED_GAP = 2;

describe("version macros", () => {
  it("packs and unpacks a version like ENET_VERSION", () => {
    expect.hasAssertions();

    const version = ENET_VERSION_CREATE(
      ENET_VERSION_MAJOR,
      ENET_VERSION_MINOR,
      ENET_VERSION_PATCH,
    );

    expect(version).toBe(ENET_VERSION);
    expect([
      ENET_VERSION_GET_MAJOR(version),
      ENET_VERSION_GET_MINOR(version),
      ENET_VERSION_GET_PATCH(version),
    ]).toStrictEqual([
      ENET_VERSION_MAJOR,
      ENET_VERSION_MINOR,
      ENET_VERSION_PATCH,
    ]);
  });
});

describe("time macros", () => {
  it("compares times", () => {
    expect.hasAssertions();
    expect([
      ENET_TIME_LESS(EARLIER, LATER),
      ENET_TIME_LESS(LATER, EARLIER),
      ENET_TIME_GREATER(LATER, EARLIER),
      ENET_TIME_LESS_EQUAL(EARLIER, EARLIER),
      ENET_TIME_GREATER_EQUAL(EARLIER, EARLIER),
    ]).toStrictEqual([true, false, true, true, true]);
  });

  it("compares and subtracts times across the 32-bit wrap", () => {
    expect.hasAssertions();
    expect(ENET_TIME_LESS(LAST_UINT32, AFTER_WRAP)).toBe(true);
    expect([
      ENET_TIME_DIFFERENCE(LATER, EARLIER),
      ENET_TIME_DIFFERENCE(EARLIER, LATER),
      ENET_TIME_DIFFERENCE(AFTER_WRAP, LAST_UINT32),
    ]).toStrictEqual([GAP, GAP, WRAPPED_GAP]);
  });
});
