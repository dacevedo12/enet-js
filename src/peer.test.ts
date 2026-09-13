import { describe, expect, it } from "vitest";

import {
  CHANNEL,
  createPacket,
  localAddress,
  receivePacket,
  serviceUntil,
  withConnection,
} from "./fixtures.js";

import { ENetEventType, enet } from "./index.js";

const PORT = 8888;
const DISCONNECT_DATA = 42;
const SEND_SUCCESS = 0;
const MESSAGE = "test message";
const address = localAddress(PORT);

describe("peer send", () => {
  it("sends a packet to a connected peer", () => {
    withConnection(address, ({ client, peer, server }) => {
      const sent = createPacket(Buffer.from(MESSAGE));

      expect(enet.peer.send(peer, CHANNEL, sent)).toBe(SEND_SUCCESS);

      enet.host.flush(client);

      const received = receivePacket(server, client);

      expect(received.data.toString()).toBe(MESSAGE);
      expect(received.dataLength).toBe(MESSAGE.length);
    });
  });
});

describe("peer disconnect", () => {
  it("disconnects gracefully with data", () => {
    withConnection(address, ({ client, peer, server }) => {
      enet.peer.disconnect(peer, DISCONNECT_DATA);

      const event = serviceUntil(server, client, ENetEventType.disconnect);

      expect(event.data).toBe(DISCONNECT_DATA);
    });
  });
});

describe("peer reset", () => {
  it("resets a connection", () => {
    withConnection(address, ({ peer }) => {
      expect(() => {
        enet.peer.reset(peer);
      }).not.toThrow();
    });
  });
});
