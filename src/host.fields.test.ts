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
import type { IENetHost } from "./index.js";
import {
  ENET_PROTOCOL_MAXIMUM_CHANNEL_COUNT,
  ENetEventType,
  enet,
} from "./index.js";
import { nonNull } from "./util.js";

vi.setConfig({ testTimeout: 10_000 });

const PORT = 9101;
const PEER_COUNT = 3;
const INCOMING_BANDWIDTH = 10_000;
const OUTGOING_BANDWIDTH = 20_000;
const NEW_CHANNEL_LIMIT = 4;
const NEW_INCOMING_BANDWIDTH = 30_000;
const NEW_OUTGOING_BANDWIDTH = 40_000;
const TOTAL = 5;
const NOTHING = 0;
const FIRST_PEER = 0;
const MESSAGE = "first message";
const SECOND_MESSAGE = "second message";
const address = localAddress(PORT);

const withHost = (run: (host: IENetHost) => void): void => {
  withEnet(() => {
    const host = nonNull(
      enet.host.create(
        null,
        PEER_COUNT,
        INCOMING_BANDWIDTH,
        OUTGOING_BANDWIDTH,
      ),
      "Unable to create a host",
    );

    withHosts([host], () => {
      run(host);
    });
  });
};

describe("host fields", () => {
  it("reads the address a server was created with", () => {
    expect.hasAssertions();

    withEnet(() => {
      const server = createServer(address);

      withHosts([server], () => {
        expect(server.address).toStrictEqual(address);
      });
    });
  });

  it("reads the limits and defaults the host was created with", () => {
    expect.hasAssertions();

    withHost((host) => {
      expect(host).toMatchObject({
        channelLimit: ENET_PROTOCOL_MAXIMUM_CHANNEL_COUNT,
        checksum: null,
        incomingBandwidth: INCOMING_BANDWIDTH,
        outgoingBandwidth: OUTGOING_BANDWIDTH,
        peerCount: PEER_COUNT,
      });
      expect(host.peers).toHaveLength(PEER_COUNT);
    });
  });

  it("returns its peers as the same objects connect and events return", () => {
    expect.hasAssertions();

    withEnet(() => {
      const server = createServer(address);
      const client = createClient();

      withHosts([client, server], () => {
        const peer = connectPeer(client, address);

        expect(client.peers[FIRST_PEER]).toBe(peer);
      });
    });
  });
});

describe("host writable fields", () => {
  it("writes the fields ENet documents as writable", () => {
    expect.hasAssertions();

    withHost((host) => {
      host.totalReceivedData = TOTAL;
      host.totalReceivedPackets = TOTAL;
      host.totalSentData = TOTAL;
      host.totalSentPackets = TOTAL;

      expect(host).toMatchObject({
        totalReceivedData: TOTAL,
        totalReceivedPackets: TOTAL,
        totalSentData: TOTAL,
        totalSentPackets: TOTAL,
      });
    });
  });

  it("counts traffic in the totals", () => {
    expect.hasAssertions();

    withConnection(address, ({ client, server }) => {
      expect(client.totalSentData).toBeGreaterThan(NOTHING);
      expect(client.totalSentPackets).toBeGreaterThan(NOTHING);
      expect(server.totalReceivedData).toBeGreaterThan(NOTHING);
      expect(server.totalReceivedPackets).toBeGreaterThan(NOTHING);
    });
  });
});

describe("host limits", () => {
  it("changes the channel and bandwidth limits", () => {
    expect.hasAssertions();

    withHost((host) => {
      enet.host.channelLimit(host, NEW_CHANNEL_LIMIT);
      enet.host.bandwidthLimit(
        host,
        NEW_INCOMING_BANDWIDTH,
        NEW_OUTGOING_BANDWIDTH,
      );

      expect(host).toMatchObject({
        channelLimit: NEW_CHANNEL_LIMIT,
        incomingBandwidth: NEW_INCOMING_BANDWIDTH,
        outgoingBandwidth: NEW_OUTGOING_BANDWIDTH,
      });
    });
  });
});

describe("host check events", () => {
  it("returns a none event when nothing is queued", () => {
    expect.hasAssertions();

    withHost((host) => {
      expect(enet.host.checkEvents(host).type).toBe(ENetEventType.none);
    });
  });

  it("returns an event that is already queued, without servicing", () => {
    expect.hasAssertions();

    withConnection(address, ({ client, peer, server }) => {
      enet.peer.send(peer, CHANNEL, createPacket(Buffer.from(MESSAGE)));
      enet.peer.send(peer, CHANNEL, createPacket(Buffer.from(SECOND_MESSAGE)));
      enet.host.flush(client);
      serviceUntil(server, client, ENetEventType.receive);

      const event = enet.host.checkEvents(server);

      expect(event.type).toBe(ENetEventType.receive);
      expect(event.packet?.data.toString()).toBe(SECOND_MESSAGE);
    });
  });
});
