/* eslint-disable @typescript-eslint/init-declarations */
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  ENetEventType,
  ENetPacketFlag,
  type IENetAddress,
  type IENetHost,
  type IENetPeer,
  enet,
} from "./index.js";

describe("peer", () => {
  const address: IENetAddress = { host: "127.0.0.1", port: 8888 };

  let server: IENetHost;
  let client: IENetHost;
  let peer: IENetPeer;

  beforeEach(() => {
    enet.initialize();
    server = enet.host.create(address, 32, 0, 0, 0)!;
    client = enet.host.create(null, 1, 0, 0, 0)!;
    peer = enet.host.connect(client, address, 1, 0)!;

    let connected = false;
    for (let i = 0; i < 100 && !connected; i++) {
      enet.host.service(client, 5);
      const event = enet.host.service(server, 5);
      if (event.type === ENetEventType.connect) {
        connected = true;
      }
    }
  });

  afterEach(() => {
    enet.host.destroy(client);
    enet.host.destroy(server);
    enet.deinitialize();
  });

  describe("send", () => {
    it("sends a packet to a connected peer", () => {
      const data = Buffer.from("test message");
      const packet = enet.packet.create(data, ENetPacketFlag.reliable)!;
      const result = enet.peer.send(peer, 0, packet);
      expect(result).toBe(0);
      enet.host.flush(client);

      let receivedData: string | null = null;
      for (let i = 0; i < 100 && receivedData === null; i++) {
        const event = enet.host.service(server, 5);
        if (event.type === ENetEventType.receive) {
          receivedData = event.packet.data.toString();
          expect(event.packet.dataLength).toBe(12);
        }
        enet.host.service(client, 5);
      }

      expect(receivedData).toBe("test message");
    });
  });

  describe("disconnect", () => {
    it("gracefully disconnects with data", () => {
      enet.peer.disconnect(peer, 42);

      let disconnected = false;
      let disconnectData: number | null = null;
      for (let i = 0; i < 100 && !disconnected; i++) {
        enet.host.service(client, 5);
        const event = enet.host.service(server, 5);
        if (event.type === ENetEventType.disconnect) {
          disconnected = true;
          disconnectData = event.data;
        }
      }

      expect(disconnected).toBe(true);
      expect(disconnectData).toBe(42);
    });
  });

  describe("reset", () => {
    it("forcefully disconnects", () => {
      expect(() => {
        enet.peer.reset(peer);
      }).not.toThrow();
    });
  });
});
