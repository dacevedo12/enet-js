import { describe, expect, it, vi } from "vitest";

import {
  CHANNEL,
  connectPeer,
  createClient,
  createPacket,
  createServer,
  localAddress,
  serviceUntil,
  withConnection,
  withEnet,
  withHosts,
} from "./fixtures.js";
import { ENetEventType, ENetPacketFlag, enet } from "./index.js";

vi.setConfig({ testTimeout: 10_000 });

const PORT = 9001;
const NO_MTU = 0;
const DISCONNECT_DATA = 7;
const EMPTY = 0;
const MESSAGE = "handle message";
const EDIT = "J";
const EDITED = "Jandle message";
const address = localAddress(PORT);

describe("peer identity", () => {
  it("returns the peer from connect in the client's CONNECT event", () => {
    expect.hasAssertions();

    withEnet(() => {
      const server = createServer(address);
      const client = createClient();

      withHosts([client, server], () => {
        const peer = connectPeer(client, address);

        expect(serviceUntil(client, server, ENetEventType.connect).peer).toBe(
          peer,
        );
      });
    });
  });

  it("returns one server-side peer from RECEIVE to DISCONNECT", () => {
    expect.hasAssertions();

    withConnection(address, ({ client, peer, server }) => {
      enet.peer.send(peer, CHANNEL, createPacket(Buffer.from(MESSAGE)));
      enet.host.flush(client);

      const received = serviceUntil(server, client, ENetEventType.receive);

      enet.peer.disconnect(peer, DISCONNECT_DATA);

      expect(serviceUntil(server, client, ENetEventType.disconnect).peer).toBe(
        received.peer,
      );
    });
  });
});

describe("peer slots", () => {
  it("keep their peer object when reused, like the ENetPeer pointer in C", () => {
    expect.hasAssertions();

    withEnet(() => {
      const client = createClient();

      withHosts([client], () => {
        const first = connectPeer(client, address);

        enet.peer.reset(first);

        expect(connectPeer(client, address)).toBe(first);
      });
    });
  });
});

describe("handle fields", () => {
  it("read the peer's struct when accessed", () => {
    expect.hasAssertions();

    withConnection(address, ({ peer }) => {
      expect(peer.address).toStrictEqual(address);
      expect(peer.mtu).toBeGreaterThan(NO_MTU);
    });
  });

  it("read the packet's struct when accessed", () => {
    expect.hasAssertions();

    const packet = createPacket(Buffer.from(MESSAGE));

    expect(packet).toMatchObject({
      dataLength: MESSAGE.length,
      referenceCount: EMPTY,
    });

    enet.packet.destroy(packet);
  });
});

describe("packet data", () => {
  it("is a view of the packet's memory", () => {
    expect.hasAssertions();

    const packet = createPacket(Buffer.from(MESSAGE));

    packet.data.write(EDIT);

    expect(packet.data.toString()).toBe(EDITED);

    enet.packet.destroy(packet);
  });

  it("is empty for an empty payload", () => {
    expect.hasAssertions();

    const packet = createPacket(Buffer.alloc(EMPTY));

    expect(packet.data).toStrictEqual(Buffer.alloc(EMPTY));

    enet.packet.destroy(packet);
  });

  it("is the caller's Buffer with noAllocate, as in C", () => {
    expect.hasAssertions();

    const payload = Buffer.from(MESSAGE);
    const packet = createPacket(payload, ENetPacketFlag.noAllocate);

    payload.write(EDIT);

    expect(packet.data.toString()).toBe(EDITED);

    enet.packet.destroy(packet);
  });
});
