/* eslint-disable @typescript-eslint/naming-convention */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ENetPacketFlag, enet } from "./index.js";

describe("packet", () => {
  beforeEach(() => {
    enet.initialize();
  });

  afterEach(() => {
    enet.deinitialize();
  });

  describe("create", () => {
    it.each([
      { flag: ENetPacketFlag.none, label: "none" },
      { flag: ENetPacketFlag.reliable, label: "reliable" },
      { flag: ENetPacketFlag.unsequenced, label: "unsequenced" },
    ])("creates a packet with $label flag", ({ flag }) => {
      const data = Buffer.from("hello");
      const packet = enet.packet.create(data, flag);
      expect(packet).not.toBeNull();
      expect(packet!.flags).toBe(flag);
      expect(packet!.data.toString()).toBe("hello");
      enet.packet.destroy(packet!);
    });

    it("preserves binary data", () => {
      const data = Buffer.from([0x00, 0xff, 0x42, 0xde, 0xad]);
      const packet = enet.packet.create(data)!;
      expect(packet.dataLength).toBe(5);
      expect(packet.data).toEqual(data);
      enet.packet.destroy(packet);
    });

    it("returns null when native enet_packet_create returns null", async () => {
      vi.resetModules();

      vi.doMock("./native/index.js", () => ({
        ENetPacket: {},
        enet_packet_create: (): null => null,
        enet_packet_destroy: (): void => undefined,
      }));

      const { create } = await import("./packet.js");
      expect(create(Buffer.from("test"))).toBeNull();
    });
  });
});
