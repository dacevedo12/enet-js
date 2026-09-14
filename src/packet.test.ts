import { describe, expect, it, vi } from "vitest";

import { createPacket, withEnet } from "./fixtures.js";
import type { IENetPacket } from "./index.js";
import { ENetPacketFlag, enet } from "./index.js";
// oxlint-disable-next-line import/no-namespace -- the mock replaces one binding and keeps the others
import * as native from "./native/index.js";
import { nonNull } from "./util.js";

vi.setConfig({ testTimeout: 10_000 });

const TEXT = "hello";
const BINARY = Buffer.from("00ff42dead", "hex");
const GROWN_LENGTH = 64;
const SHRUNK_LENGTH = 2;
const RESIZE_SUCCESS = 0;
const START = 0;
const NO_REFERENCES = 0;
const MESSAGE = "free callback failed";
const flagCases = [
  { flag: ENetPacketFlag.none, label: "none" },
  { flag: ENetPacketFlag.reliable, label: "reliable" },
  { flag: ENetPacketFlag.unsequenced, label: "unsequenced" },
] as const;

const failingPacketCreate: typeof native.enet_packet_create = Object.assign(
  (): null => null,
  {
    async: native.enet_packet_create.async,
    info: native.enet_packet_create.info,
  },
);

describe("packet create", () => {
  it.each(flagCases)("creates a packet with the $label flag", ({ flag }) => {
    expect.hasAssertions();

    withEnet(() => {
      const packet = createPacket(Buffer.from(TEXT), flag);

      expect(packet.flags).toBe(flag);
      expect(packet.data.toString()).toBe(TEXT);

      enet.packet.destroy(packet);
    });
  });

  it("preserves binary data with the default flags", () => {
    expect.hasAssertions();

    withEnet(() => {
      const packet = nonNull(
        enet.packet.create(BINARY),
        "Unable to create a packet",
      );

      expect(packet).toMatchObject({
        dataLength: BINARY.length,
        flags: ENetPacketFlag.none,
        referenceCount: NO_REFERENCES,
      });
      expect(packet.data).toStrictEqual(BINARY);

      enet.packet.destroy(packet);
    });
  });
});

describe("packet create failure", () => {
  it("returns null when enet_packet_create returns NULL", async () => {
    expect.hasAssertions();

    vi.resetModules();
    vi.doMock(import("./native/index.js"), () => ({
      ...native,
      enet_packet_create: failingPacketCreate,
    }));

    const { create } = await import("./packet.js");

    expect(create(BINARY)).toBeNull();
  });
});

describe("packet resize", () => {
  it("grows the data into new memory, keeping its bytes", () => {
    expect.hasAssertions();

    const packet = createPacket(Buffer.from(TEXT));

    expect(enet.packet.resize(packet, GROWN_LENGTH)).toBe(RESIZE_SUCCESS);
    expect(packet.dataLength).toBe(GROWN_LENGTH);
    expect(packet.data.subarray(START, TEXT.length).toString()).toBe(TEXT);

    enet.packet.destroy(packet);
  });

  it("shrinks the data length in place", () => {
    expect.hasAssertions();

    const packet = createPacket(Buffer.from(TEXT));

    expect(enet.packet.resize(packet, SHRUNK_LENGTH)).toBe(RESIZE_SUCCESS);
    expect(packet.data.toString()).toBe(TEXT.slice(START, SHRUNK_LENGTH));

    enet.packet.destroy(packet);
  });
});

describe("packet free callback", () => {
  it("gets the packet before ENet frees it", () => {
    expect.hasAssertions();

    const packet = createPacket(Buffer.from(TEXT));
    const freed: IENetPacket[] = [];

    packet.freeCallback = (freedPacket): void => {
      freed.push(freedPacket);
    };

    expect(packet.freeCallback).toBeTypeOf("function");

    enet.packet.destroy(packet);

    expect(freed).toStrictEqual([packet]);
  });

  it("clears the callback with null", () => {
    expect.hasAssertions();

    const packet = createPacket(Buffer.from(TEXT));
    const freed: IENetPacket[] = [];

    packet.freeCallback = (freedPacket): void => {
      freed.push(freedPacket);
    };
    packet.freeCallback = null;
    enet.packet.destroy(packet);

    expect(packet.freeCallback).toBeNull();
    expect(freed).toStrictEqual([]);
  });
});

describe("packet free callback errors", () => {
  it("rethrows an error from the callback once destroy returns", () => {
    expect.hasAssertions();

    const packet = createPacket(Buffer.from(TEXT));

    packet.freeCallback = (): never => {
      throw new Error(MESSAGE);
    };

    expect(() => {
      enet.packet.destroy(packet);
    }).toThrow(MESSAGE);
  });
});
