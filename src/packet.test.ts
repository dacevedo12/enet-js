import { describe, expect, it, vi } from "vitest";

import { createPacket, withEnet } from "./fixtures.js";
import { ENetPacketFlag, enet } from "./index.js";
import { enet_packet_create } from "./native/index.js";
import { nonNull } from "./util.js";

const TEXT = "hello";
const BINARY = Buffer.from("00ff42dead", "hex");
const flagCases = [
  { flag: ENetPacketFlag.none, label: "none" },
  { flag: ENetPacketFlag.reliable, label: "reliable" },
  { flag: ENetPacketFlag.unsequenced, label: "unsequenced" },
] as const;

const failingPacketCreate: typeof enet_packet_create = Object.assign(
  (): null => null,
  { async: enet_packet_create.async, info: enet_packet_create.info },
);

describe("packet create", () => {
  it.each(flagCases)("creates a packet with the $label flag", ({ flag }) => {
    withEnet(() => {
      const packet = createPacket(Buffer.from(TEXT), flag);

      expect(packet.flags).toBe(flag);
      expect(packet.data.toString()).toBe(TEXT);

      enet.packet.destroy(packet);
    });
  });

  it("preserves binary data with the default flags", () => {
    withEnet(() => {
      const packet = nonNull(
        enet.packet.create(BINARY),
        "Unable to create a packet",
      );

      expect(packet).toMatchObject({
        dataLength: BINARY.length,
        flags: ENetPacketFlag.none,
      });
      expect(packet.data).toStrictEqual(BINARY);

      enet.packet.destroy(packet);
    });
  });
});

describe("packet create failure", () => {
  it("returns null when enet_packet_create returns NULL", async () => {
    vi.resetModules();
    vi.doMock(import("./native/index.js"), () => ({
      // eslint-disable-next-line @typescript-eslint/naming-convention -- mocks the native enet_packet_create binding
      enet_packet_create: failingPacketCreate,
    }));

    const { create } = await import("./packet.js");

    expect(create(BINARY)).toBeNull();
  });
});
