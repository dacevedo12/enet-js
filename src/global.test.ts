import { describe, expect, it, vi } from "vitest";

import { createPacket } from "./fixtures.js";
import { ENET_VERSION, enet } from "./index.js";

vi.setConfig({ testTimeout: 10_000 });

const INITIALIZE_SUCCESS = 0;
const RESIZE_FAILURE = -1;
// More memory than malloc can hand out
const IMPOSSIBLE_SIZE = 4_503_599_627_370_496;
const MESSAGE = "noMemory failed";
const TEXT = "memory";

describe("global", () => {
  it("initializes and deinitializes ENet", () => {
    expect.hasAssertions();
    expect(enet.initialize()).toBe(INITIALIZE_SUCCESS);

    enet.deinitialize();
  });

  it("reports the version of the loaded library", () => {
    expect.hasAssertions();
    expect(enet.linkedVersion()).toBe(ENET_VERSION);
  });
});

describe("initialize with callbacks", () => {
  it("keeps ENet's defaults when no callbacks are given", () => {
    expect.hasAssertions();
    expect(enet.initializeWithCallbacks(ENET_VERSION, {})).toBe(
      INITIALIZE_SUCCESS,
    );

    enet.deinitialize();
  });

  it("calls noMemory when an allocation fails", () => {
    expect.hasAssertions();

    const calls: string[] = [];

    expect(
      enet.initializeWithCallbacks(ENET_VERSION, {
        noMemory: () => {
          calls.push(TEXT);
        },
      }),
    ).toBe(INITIALIZE_SUCCESS);

    const packet = createPacket(Buffer.from(TEXT));

    expect(enet.packet.resize(packet, IMPOSSIBLE_SIZE)).toBe(RESIZE_FAILURE);
    expect(calls).toStrictEqual([TEXT]);

    enet.packet.destroy(packet);
    enet.deinitialize();
  });

  it("rethrows an error from noMemory once the call that ran out returns", () => {
    expect.hasAssertions();

    enet.initializeWithCallbacks(ENET_VERSION, {
      noMemory: () => {
        throw new Error(MESSAGE);
      },
    });

    const packet = createPacket(Buffer.from(TEXT));

    expect(() => enet.packet.resize(packet, IMPOSSIBLE_SIZE)).toThrow(MESSAGE);

    enet.packet.destroy(packet);
    enet.deinitialize();
  });
});
