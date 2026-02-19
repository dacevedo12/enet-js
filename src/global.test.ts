import { describe, expect, it } from "vitest";

import { enet } from "./index.js";

describe("global", () => {
  it("performs the lifecycle", () => {
    const result = enet.initialize();
    expect(result).toBe(0);
    enet.deinitialize();
  });
});
