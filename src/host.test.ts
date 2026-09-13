import { describe, expect, it } from "vitest";

import {
  CHANNEL,
  connectOrNull,
  connectPeer,
  createClient,
  createPacket,
  createServer,
  createServerOrNull,
  localAddress,
  receivePacket,
  withConnection,
  withEnet,
  withHosts,
} from "./fixtures.js";

import { ENetEventType, enet } from "./index.js";

const PORT = 7777;
const NO_WAIT = 0;
const BROADCAST_MESSAGE = "broadcast message";
const SENT_MESSAGE = "sent message";
const address = localAddress(PORT);

describe("host create", () => {
  it("creates a server host bound to an address", () => {
    withEnet(() => {
      expect(() => {
        enet.host.destroy(createServer(address));
      }).not.toThrow();
    });
  });

  it("creates a client host without an address", () => {
    withEnet(() => {
      expect(() => {
        enet.host.destroy(createClient());
      }).not.toThrow();
    });
  });

  it("returns null when binding to a port already in use", () => {
    withEnet(() => {
      const server = createServer(address);

      withHosts([server], () => {
        expect(createServerOrNull(address)).toBeNull();
      });
    });
  });
});

describe("host connect", () => {
  it("connects to a remote host", () => {
    withEnet(() => {
      const server = createServer(address);
      const client = createClient();

      withHosts([client, server], () => {
        expect(connectPeer(client, address).address).toStrictEqual(address);
      });
    });
  });

  it("returns null when no peer slots are available", () => {
    withEnet(() => {
      const client = createClient();

      withHosts([client], () => {
        connectPeer(client, address);

        expect(connectOrNull(client, address)).toBeNull();
      });
    });
  });
});

describe("host service", () => {
  it("returns a none event when nothing is pending", () => {
    withEnet(() => {
      const server = createServer(address);

      withHosts([server], () => {
        expect(enet.host.service(server, NO_WAIT)).toMatchObject({
          packet: null,
          peer: null,
          type: ENetEventType.none,
        });
      });
    });
  });
});

describe("host broadcast", () => {
  it("broadcasts a packet to connected peers", () => {
    withConnection(address, ({ client, server }) => {
      const packet = createPacket(Buffer.from(BROADCAST_MESSAGE));

      enet.host.broadcast(server, CHANNEL, packet);
      enet.host.flush(server);

      expect(receivePacket(client, server).data.toString()).toBe(
        BROADCAST_MESSAGE,
      );
    });
  });
});

describe("host flush", () => {
  it("flushes queued packets to the network", () => {
    withConnection(address, ({ client, peer, server }) => {
      const packet = createPacket(Buffer.from(SENT_MESSAGE));

      enet.peer.send(peer, CHANNEL, packet);
      enet.host.flush(client);

      expect(receivePacket(server, client).data.toString()).toBe(SENT_MESSAGE);
    });
  });
});
