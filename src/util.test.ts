import { describe, expect, it } from "vitest";

import { ipFromLong, ipToLong, nonNull } from "./util.js";

const VALUE = "value";
const MESSAGE = "missing value";
const addresses = [
  { ip: "0.0.0.0", long: 0 },
  { ip: "127.0.0.1", long: 0x0100007f },
  { ip: "255.255.255.255", long: 0xffffffff },
  { ip: "192.168.1.1", long: 0x0101a8c0 },
  { ip: "10.0.0.1", long: 0x0100000a },
] as const;

describe("ipToLong", () => {
  it.each(addresses)("converts $ip to $long", ({ ip, long }) => {
    expect(ipToLong(ip)).toBe(long);
  });
});

describe("ipFromLong", () => {
  it.each(addresses)("converts $long to $ip", ({ ip, long }) => {
    expect(ipFromLong(long)).toBe(ip);
  });
});

describe("nonNull", () => {
  it("returns a value that is not null", () => {
    expect(nonNull(VALUE, MESSAGE)).toBe(VALUE);
  });

  it("throws the message for null", () => {
    expect(() => nonNull(null, MESSAGE)).toThrow(MESSAGE);
  });
});
