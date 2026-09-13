import { describe, expect, it, vi } from "vitest";

vi.setConfig({ testTimeout: 10_000 });

describe("native", () => {
  it("throws when ENET_LIB_PATH is not set", async () => {
    expect.hasAssertions();

    // oxlint-disable-next-line unicorn/no-useless-undefined -- vi.stubEnv only unsets a variable when given undefined
    vi.stubEnv("ENET_LIB_PATH", undefined);

    await expect(import("./native/index.js")).rejects.toThrow(
      "ENET_LIB_PATH is not set; set it to the full path of the ENet shared library",
    );
  });
});
