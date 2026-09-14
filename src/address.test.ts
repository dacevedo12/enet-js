import { describe, expect, it, vi } from "vitest";

import { readHostName } from "./address.js";
import { ENET_HOST_ANY, enet } from "./index.js";

vi.setConfig({ testTimeout: 10_000 });

const LOCALHOST = "127.0.0.1";
const PORT = 1234;
const SUCCESS = 0;
const FAILURE = -1;
const NAME = "name";
const EMPTY_NAME_LENGTH = 4;
const anyAddress = { host: ENET_HOST_ANY, port: PORT };
const localhost = { host: LOCALHOST, port: PORT };

describe("address host ip", () => {
  it("formats the host as a dotted quad", () => {
    expect.hasAssertions();
    expect(enet.address.getHostIp(localhost)).toBe(LOCALHOST);
  });
});

describe("address host name", () => {
  it("resolves a host name and keeps the port", () => {
    expect.hasAssertions();
    expect(enet.address.setHost(anyAddress, "localhost")).toStrictEqual(
      localhost,
    );
  });

  it("parses a dotted quad", () => {
    expect.hasAssertions();
    expect(enet.address.setHost(anyAddress, LOCALHOST)).toStrictEqual(
      localhost,
    );
  });

  it("looks up the name of a host", () => {
    expect.hasAssertions();
    expect(enet.address.getHost(localhost)).toBeTypeOf("string");
  });

  it("reads a name up to its NUL, or null for a failed call", () => {
    expect.hasAssertions();
    expect(readHostName(SUCCESS, Buffer.from(`${NAME}\0rest`))).toBe(NAME);
    expect(readHostName(FAILURE, Buffer.alloc(EMPTY_NAME_LENGTH))).toBeNull();
  });
});
