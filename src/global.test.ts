import { describe, expect, it, vi } from "vitest";

import { enet } from "./index.js";

vi.setConfig({ testTimeout: 10_000 });

const INITIALIZE_SUCCESS = 0;

describe("global", () => {
  it("initializes and deinitializes ENet", () => {
    expect.hasAssertions();
    expect(enet.initialize()).toBe(INITIALIZE_SUCCESS);

    enet.deinitialize();
  });
});
