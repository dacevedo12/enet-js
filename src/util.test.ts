import { describe, expect, it } from "vitest";

import { ipFromLong, ipToLong } from "./util.js";

describe("ipToLong", () => {
  it.each([
    ["0.0.0.0", 0],
    ["127.0.0.1", 0x0100007f],
    ["255.255.255.255", 0xffffffff],
    ["192.168.1.1", 0x0101a8c0],
    ["10.0.0.1", 0x0100000a],
  ])("converts %s to %d", (ip, expected) => {
    expect(ipToLong(ip)).toBe(expected);
  });
});

describe("ipFromLong", () => {
  it.each([
    [0, "0.0.0.0"],
    [0x0100007f, "127.0.0.1"],
    [0xffffffff, "255.255.255.255"],
    [0x0101a8c0, "192.168.1.1"],
    [0x0100000a, "10.0.0.1"],
  ])("converts %d to %s", (ip, expected) => {
    expect(ipFromLong(ip)).toBe(expected);
  });
});
