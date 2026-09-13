import { describe, expect, it, vi } from "vitest";

import { enet } from "./index.js";

vi.setConfig({ testTimeout: 10_000 });

const START = 1_000_000;
const SLACK = 1000;

describe("time", () => {
  it("counts milliseconds from the time it was set to", () => {
    expect.hasAssertions();

    enet.time.set(START);

    const now = enet.time.get();

    expect(now).toBeGreaterThanOrEqual(START);
    expect(now).toBeLessThan(START + SLACK);
  });
});
