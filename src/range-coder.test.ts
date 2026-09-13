import { describe, expect, it, vi } from "vitest";

import { enet } from "./index.js";
// oxlint-disable-next-line import/no-namespace -- the mock replaces one binding and keeps the others
import * as native from "./native/index.js";
import { nonNull } from "./util.js";

vi.setConfig({ testTimeout: 10_000 });

const REPEATS = 100;
const FIRST = "a".repeat(REPEATS);
const SECOND = "b".repeat(REPEATS);
const INPUT = [Buffer.from(FIRST), Buffer.from(SECOND)];
const INPUT_LENGTH = FIRST.length + SECOND.length;
const OUT_LIMIT = 1024;
const NOTHING = 0;

const failingRangeCoderCreate: typeof native.enet_range_coder_create =
  Object.assign((): null => null, {
    async: native.enet_range_coder_create.async,
    info: native.enet_range_coder_create.info,
  });

describe("range coder", () => {
  it("compresses buffers and decompresses them back", () => {
    expect.hasAssertions();

    const rangeCoder = nonNull(
      enet.rangeCoder.create(),
      "Unable to create a range coder",
    );
    const compressed = Buffer.alloc(OUT_LIMIT);
    const compressedLength = enet.rangeCoder.compress(
      rangeCoder,
      INPUT,
      INPUT_LENGTH,
      compressed,
      compressed.length,
    );
    const output = Buffer.alloc(INPUT_LENGTH);
    const decompressedLength = enet.rangeCoder.decompress(
      rangeCoder,
      compressed,
      compressedLength,
      output,
      output.length,
    );

    enet.rangeCoder.destroy(rangeCoder);

    expect([
      compressedLength > NOTHING,
      compressedLength < INPUT_LENGTH,
      decompressedLength,
    ]).toStrictEqual([true, true, INPUT_LENGTH]);
    expect(output.toString()).toBe(FIRST + SECOND);
  });

  it("returns null when enet_range_coder_create returns NULL", async () => {
    expect.hasAssertions();

    vi.resetModules();
    vi.doMock(import("./native/index.js"), () => ({
      ...native,
      enet_range_coder_create: failingRangeCoderCreate,
    }));

    const { create } = await import("./range-coder.js");

    expect(create()).toBeNull();
  });
});
