import { describe, expect, it, vi } from "vitest";

import { ipFromLong, ipToLong, nonNull } from "./util.js";

vi.setConfig({ testTimeout: 10_000 });

const VALUE = "value";
const MESSAGE = "missing value";
const addresses = [
  { ip: "0.0.0.0", long: 0 },
  { ip: "127.0.0.1", long: 0x01_00_00_7f },
  { ip: "255.255.255.255", long: 0xff_ff_ff_ff },
  { ip: "192.168.1.1", long: 0x01_01_a8_c0 },
  { ip: "10.0.0.1", long: 0x01_00_00_0a },
] as const;

describe("ipToLong", () => {
  it.each(addresses)("converts $ip to $long", ({ ip, long }) => {
    expect.hasAssertions();
    expect(ipToLong(ip)).toBe(long);
  });
});

describe("ipFromLong", () => {
  it.each(addresses)("converts $long to $ip", ({ ip, long }) => {
    expect.hasAssertions();
    expect(ipFromLong(long)).toBe(ip);
  });
});

describe("nonNull", () => {
  it("throws the message for undefined", () => {
    expect.hasAssertions();
    expect(() => {
      nonNull(undefined, MESSAGE);
    }).toThrow(MESSAGE);
  });

  it("returns a value that is not null", () => {
    expect.hasAssertions();
    expect(nonNull(VALUE, MESSAGE)).toBe(VALUE);
  });

  it("throws the message for null", () => {
    expect.hasAssertions();
    expect(() => nonNull(null, MESSAGE)).toThrow(MESSAGE);
  });
});
