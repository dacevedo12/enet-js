import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  ENetEventType,
  ENetPacketFlag,
  type IENetAddress,
  enet,
} from "./index.js";

describe("host", () => {
  const address: IENetAddress = { host: "127.0.0.1", port: 7777 };

  beforeEach(() => {
    enet.initialize();
  });

  afterEach(() => {
    enet.deinitialize();
  });

  describe("create", () => {
    it("creates a server host with address", () => {
      const host = enet.host.create(address, 32, 0, 0, 0);
      expect(host).not.toBeNull();
      expect(() => {
        enet.host.destroy(host!);
      }).not.toThrow();
    });

    it("creates a client host with null address", () => {
      const host = enet.host.create(null, 1, 0, 0, 0);
      expect(host).not.toBeNull();
      enet.host.destroy(host!);
    });

    it("returns null when binding to a port already in use", () => {
      const host = enet.host.create(address, 32, 0, 0, 0)!;
      const secondHost = enet.host.create(address, 32, 0, 0, 0)!;
      expect(secondHost).toBeNull();
      enet.host.destroy(host);
    });
  });

  describe("connect", () => {
    it("connects to a remote host", () => {
      const server = enet.host.create(address, 32, 0, 0, 0)!;
      const client = enet.host.create(null, 1, 0, 0, 0)!;

      const peer = enet.host.connect(client, address, 1, 0);
      expect(peer).not.toBeNull();
      expect(peer!.address.host).toBe("127.0.0.1");
      expect(peer!.address.port).toBe(7777);

      enet.host.destroy(client);
      enet.host.destroy(server);
    });

    it("returns null when no peer slots are available", () => {
      const host = enet.host.create(null, 1, 0, 0, 0)!;

      expect(enet.host.connect(host, address, 1, 0)).not.toBeNull();
      expect(enet.host.connect(host, address, 1, 0)).toBeNull();

      enet.host.destroy(host);
    });
  });

  describe("service", () => {
    it("returns a none event when no events are pending", () => {
      const host = enet.host.create(address, 32, 0, 0, 0)!;
      const event = enet.host.service(host, 0);
      expect(event.type).toBe(ENetEventType.none);
      expect(event.peer).toBeNull();
      expect(event.packet).toBeNull();
      enet.host.destroy(host);
    });
  });

  describe("broadcast", () => {
    it("broadcasts a packet to all connected peers", () => {
      const server = enet.host.create(address, 32, 0, 0, 0)!;
      const client = enet.host.create(null, 1, 0, 0, 0)!;
      enet.host.connect(client, address, 1, 0);

      let connected = false;
      for (let i = 0; i < 100 && !connected; i++) {
        enet.host.service(client, 5);
        const event = enet.host.service(server, 5);
        if (event.type === ENetEventType.connect) connected = true;
      }
      expect(connected).toBe(true);

      const packet = enet.packet.create(
        Buffer.from("broadcast msg"),
        ENetPacketFlag.reliable,
      )!;
      enet.host.broadcast(server, 0, packet);
      enet.host.flush(server);

      let receivedData: string | null = null;
      for (let i = 0; i < 100 && receivedData === null; i++) {
        const event = enet.host.service(client, 5);
        if (event.type === ENetEventType.receive) {
          receivedData = event.packet.data.toString();
        }
        enet.host.service(server, 5);
      }

      expect(receivedData).toBe("broadcast msg");

      enet.host.destroy(client);
      enet.host.destroy(server);
    });
  });

  describe("flush", () => {
    it("flushes pending packets to the network", () => {
      const server = enet.host.create(address, 32, 0, 0, 0)!;
      const client = enet.host.create(null, 1, 0, 0, 0)!;
      const peer = enet.host.connect(client, address, 1, 0)!;

      let connected = false;
      for (let i = 0; i < 100 && !connected; i++) {
        enet.host.service(client, 5);
        const event = enet.host.service(server, 5);
        if (event.type === ENetEventType.connect) connected = true;
      }
      expect(connected).toBe(true);

      const packet = enet.packet.create(
        Buffer.from("test message"),
        ENetPacketFlag.reliable,
      )!;
      enet.peer.send(peer, 0, packet);
      enet.host.flush(client);

      let receivedData: string | null = null;
      for (let i = 0; i < 100 && receivedData === null; i++) {
        const event = enet.host.service(server, 5);
        if (event.type === ENetEventType.receive) {
          receivedData = event.packet.data.toString();
        }
        enet.host.service(client, 5);
      }

      expect(receivedData).toBe("test message");

      enet.host.destroy(client);
      enet.host.destroy(server);
    });
  });
});
