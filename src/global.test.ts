import { describe, expect, it } from "vitest";

import { enet } from "./index.js";

const INITIALIZE_SUCCESS = 0;

describe("global", () => {
  it("initializes and deinitializes ENet", () => {
    expect(enet.initialize()).toBe(INITIALIZE_SUCCESS);

    enet.deinitialize();
  });
});
