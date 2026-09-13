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
  ENET_HOST_DEFAULT_MAXIMUM_PACKET_SIZE,
  ENET_HOST_DEFAULT_MAXIMUM_WAITING_DATA,
  ENET_PORT_ANY,
  ENET_PROTOCOL_MAXIMUM_PEER_ID,
  ENetEventType,
  enet,
} from "./index.js";
import { nonNull } from "./util.js";

vi.setConfig({ testTimeout: 10_000 });

const PORT = 9101;
const LOCALHOST = "127.0.0.1";
const PEER_COUNT = 3;
const CHANNEL_LIMIT = 2;
const INCOMING_BANDWIDTH = 10_000;
const OUTGOING_BANDWIDTH = 20_000;
const NEW_CHANNEL_LIMIT = 4;
const NEW_INCOMING_BANDWIDTH = 30_000;
const NEW_OUTGOING_BANDWIDTH = 40_000;
const DUPLICATE_PEERS = 1;
const MAXIMUM_PACKET_SIZE = 1000;
const MAXIMUM_WAITING_DATA = 2000;
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
        CHANNEL_LIMIT,
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
  it("reads the address a server is bound to, with the port ENet picked", () => {
    expect.hasAssertions();

    withEnet(() => {
      const server = createServer(localAddress(ENET_PORT_ANY));

      withHosts([server], () => {
        expect(server.address.host).toBe(LOCALHOST);
        expect(server.address.port).toBeGreaterThan(ENET_PORT_ANY);
      });
    });
  });

  it("reads the limits and defaults the host was created with", () => {
    expect.hasAssertions();

    withHost((host) => {
      expect(host).toMatchObject({
        channelLimit: CHANNEL_LIMIT,
        checksum: null,
        duplicatePeers: ENET_PROTOCOL_MAXIMUM_PEER_ID,
        incomingBandwidth: INCOMING_BANDWIDTH,
        intercept: null,
        maximumPacketSize: ENET_HOST_DEFAULT_MAXIMUM_PACKET_SIZE,
        maximumWaitingData: ENET_HOST_DEFAULT_MAXIMUM_WAITING_DATA,
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
      host.duplicatePeers = DUPLICATE_PEERS;
      host.maximumPacketSize = MAXIMUM_PACKET_SIZE;
      host.maximumWaitingData = MAXIMUM_WAITING_DATA;
      host.totalReceivedData = TOTAL;
      host.totalReceivedPackets = TOTAL;
      host.totalSentData = TOTAL;
      host.totalSentPackets = TOTAL;

      expect(host).toMatchObject({
        duplicatePeers: DUPLICATE_PEERS,
        maximumPacketSize: MAXIMUM_PACKET_SIZE,
        maximumWaitingData: MAXIMUM_WAITING_DATA,
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
