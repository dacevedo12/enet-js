import { describe, expect, it, vi } from "vitest";

import {
  CHANNEL,
  createPacket,
  localAddress,
  receivePacket,
  serviceUntil,
  withConnection,
} from "./fixtures.js";
import { ENetEventType, enet } from "./index.js";
import { nonNull } from "./util.js";

vi.setConfig({ testTimeout: 10_000 });

const PORT = 8888;
const DISCONNECT_DATA = 42;
const SEND_SUCCESS = 0;
const MESSAGE = "test message";
const SECOND_MESSAGE = "second message";
const CONNECT_CHANNEL_COUNT = 1;
const ANY_BANDWIDTH = 0;
const NO_LOSS = 0;
const NO_MTU = 0;
const PING_INTERVAL = 250;
const TIMEOUT_LIMIT = 16;
const TIMEOUT_MINIMUM = 2000;
const TIMEOUT_MAXIMUM = 10_000;
const THROTTLE_INTERVAL = 1000;
const THROTTLE_ACCELERATION = 4;
const THROTTLE_DECELERATION = 4;
const PEER_DATA = { player: "one" };
const address = localAddress(PORT);

describe("peer send", () => {
  it("sends a packet to a connected peer", () => {
    expect.hasAssertions();

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

describe("peer receive", () => {
  it("receives the packets queued behind an event's packet", () => {
    expect.hasAssertions();

    withConnection(address, ({ client, peer, server }) => {
      enet.peer.send(peer, CHANNEL, createPacket(Buffer.from(MESSAGE)));
      enet.peer.send(peer, CHANNEL, createPacket(Buffer.from(SECOND_MESSAGE)));
      enet.host.flush(client);

      const event = serviceUntil(server, client, ENetEventType.receive);
      const serverPeer = nonNull(event.peer, "Expected a peer");
      const received = nonNull(
        enet.peer.receive(serverPeer),
        "Expected a queued packet",
      );

      expect(received.channelID).toBe(CHANNEL);
      expect(received.packet.data.toString()).toBe(SECOND_MESSAGE);
      expect(enet.peer.receive(serverPeer)).toBeNull();

      enet.packet.destroy(received.packet);
    });
  });
});

describe("peer disconnect", () => {
  it("disconnects gracefully with data", () => {
    expect.hasAssertions();

    withConnection(address, ({ client, peer, server }) => {
      enet.peer.disconnect(peer, DISCONNECT_DATA);

      const event = serviceUntil(server, client, ENetEventType.disconnect);

      expect(event.data).toBe(DISCONNECT_DATA);
    });
  });

  it("disconnects now, and the remote host still sees the data", () => {
    expect.hasAssertions();

    withConnection(address, ({ client, peer, server }) => {
      enet.peer.disconnectNow(peer, DISCONNECT_DATA);

      expect(serviceUntil(server, client, ENetEventType.disconnect).data).toBe(
        DISCONNECT_DATA,
      );
    });
  });

  it("disconnects later, once queued packets are delivered", () => {
    expect.hasAssertions();

    withConnection(address, ({ client, peer, server }) => {
      enet.peer.send(peer, CHANNEL, createPacket(Buffer.from(MESSAGE)));
      enet.peer.disconnectLater(peer, DISCONNECT_DATA);

      expect(receivePacket(server, client).data.toString()).toBe(MESSAGE);
      expect(serviceUntil(server, client, ENetEventType.disconnect).data).toBe(
        DISCONNECT_DATA,
      );
    });
  });
});

describe("peer reset", () => {
  it("resets a connection and keeps its data, like peer->data", () => {
    expect.hasAssertions();

    withConnection(address, ({ peer }) => {
      peer.data = PEER_DATA;
      enet.peer.reset(peer);

      expect(peer.data).toBe(PEER_DATA);
    });
  });
});

describe("peer fields", () => {
  it("reads the connection's channels, bandwidth, loss and timing", () => {
    expect.hasAssertions();

    withConnection(address, ({ peer }) => {
      expect(peer).toMatchObject({
        channelCount: CONNECT_CHANNEL_COUNT,
        data: null,
        incomingBandwidth: ANY_BANDWIDTH,
        outgoingBandwidth: ANY_BANDWIDTH,
        packetLoss: NO_LOSS,
      });
      expect(peer.mtu).toBeGreaterThan(NO_MTU);
      expect(peer.roundTripTime).toBeTypeOf("number");
    });
  });
});

describe("peer configuration", () => {
  it("pings, and sets the ping interval, timeouts and throttle", () => {
    expect.hasAssertions();

    withConnection(address, ({ client, peer }) => {
      const sentPackets = client.totalSentPackets;

      enet.peer.pingInterval(peer, PING_INTERVAL);
      enet.peer.timeout(peer, TIMEOUT_LIMIT, TIMEOUT_MINIMUM, TIMEOUT_MAXIMUM);
      enet.peer.throttleConfigure(
        peer,
        THROTTLE_INTERVAL,
        THROTTLE_ACCELERATION,
        THROTTLE_DECELERATION,
      );
      enet.peer.ping(peer);
      enet.host.flush(client);

      expect(client.totalSentPackets).toBeGreaterThan(sentPackets);
    });
  });
});
