import { describe, expect, it, vi } from "vitest";

import {
  CHANNEL,
  NEXT_MESSAGE,
  SERVICE_TIMEOUT_MS,
  connectPeer,
  createClient,
  createPacket,
  createServer,
  localAddress,
  queueAcknowledgement,
  queueAcknowledgementAndPacket,
  serviceUntil,
  withConnection,
  withEnet,
  withHosts,
} from "./fixtures.js";
import { ENetEventType, enet } from "./index.js";
import type { NativePointer } from "./native/pointers.js";
import { nonNull } from "./util.js";

// Packets enet-js destroys through the binding; ENet's own frees don't go through it
const destroyedPackets = vi.hoisted((): unknown[] => []);

vi.mock(import("./native/index.js"), async (importOriginal) => {
  const original = await importOriginal();

  return {
    ...original,
    enet_packet_destroy: Object.assign(
      (packet: NativePointer<"ENetPacket">): undefined => {
        destroyedPackets.push(packet);

        // oxlint-disable-next-line typescript/no-confusing-void-expression -- the mock returns what the binding it wraps returns
        return original.enet_packet_destroy(packet);
      },
      {
        async: original.enet_packet_destroy.async,
        info: original.enet_packet_destroy.info,
      },
    ),
  };
});

vi.setConfig({ testTimeout: 10_000 });

const PORT = 9107;
const NO_WAIT = 0;
const WAIT_MS = 1000;
const ONE_PACKET = 1;
const FREE_ERROR = "free callback failed";
const address = localAddress(PORT);

const throwOnFree = (): never => {
  throw new Error(FREE_ERROR);
};

describe("callback errors during service", () => {
  it("throw, and the next call returns the event ENet had taken", () => {
    expect.hasAssertions();

    withConnection(address, (connection) => {
      const { server } = connection;

      queueAcknowledgementAndPacket(connection, throwOnFree);

      expect(() => enet.host.service(server, SERVICE_TIMEOUT_MS)).toThrow(
        FREE_ERROR,
      );

      const event = enet.host.service(server, NO_WAIT);

      expect(event.type).toBe(ENetEventType.receive);
      expect(event.packet?.data.toString()).toBe(NEXT_MESSAGE);
      expect(enet.host.checkEvents(server).type).toBe(ENetEventType.none);

      enet.packet.destroy(nonNull(event.packet, "Expected a packet"));
    });
  });
});

describe("empty events during service", () => {
  it("aren't kept, so the next call services ENet again", () => {
    expect.hasAssertions();

    withConnection(address, (connection) => {
      const { client, peer, server } = connection;

      queueAcknowledgement(connection, throwOnFree);

      expect(() => enet.host.service(server, SERVICE_TIMEOUT_MS)).toThrow(
        FREE_ERROR,
      );

      enet.peer.send(peer, CHANNEL, createPacket(Buffer.from(NEXT_MESSAGE)));
      enet.host.flush(client);

      const event = enet.host.service(server, WAIT_MS);

      expect(event.packet?.data.toString()).toBe(NEXT_MESSAGE);

      enet.packet.destroy(nonNull(event.packet, "Expected a packet"));
    });
  });
});

describe("host destroy with a pending event", () => {
  it("destroys the packet of a RECEIVE the app never got", () => {
    expect.hasAssertions();

    withEnet(() => {
      const server = createServer(address);
      const client = createClient();

      withHosts([client], () => {
        const peer = connectPeer(client, address);

        serviceUntil(server, client, ENetEventType.connect);
        queueAcknowledgementAndPacket({ client, peer, server }, throwOnFree);

        expect(() => enet.host.service(server, SERVICE_TIMEOUT_MS)).toThrow(
          FREE_ERROR,
        );

        const destroyedBefore = destroyedPackets.length;

        enet.host.destroy(server);

        expect(destroyedPackets.length - destroyedBefore).toBe(ONE_PACKET);
      });
    });
  });
});
