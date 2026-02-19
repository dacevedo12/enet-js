import { describe, expect, it, vi } from "vitest";

describe("native", () => {
  it("throws when ENET_LIB_PATH is not set", async () => {
    vi.stubEnv("ENET_LIB_PATH", undefined);

    await expect(import("./native/index.js")).rejects.toThrow(
      "ENET_LIB_PATH is not set; set it to the full path of the ENet shared library",
    );
  });
});
