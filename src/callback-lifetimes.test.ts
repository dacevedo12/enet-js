import koffi from "koffi";
import { describe, expect, it, vi } from "vitest";

import {
  CHANNEL,
  connectPeer,
  createClient,
  createPacket,
  createServer,
  localAddress,
  receivePacket,
  serviceUntil,
  withConnection,
  withEnet,
  withHosts,
} from "./fixtures.js";
import type { IENetHost, IENetPacket } from "./index.js";
import { ENET_VERSION, ENetEventType, enet } from "./index.js";
// oxlint-disable-next-line import/no-namespace -- the mock replaces one binding and keeps the others
import * as native from "./native/index.js";

vi.setConfig({ testTimeout: 10_000 });

const PORT = 9106;
const NO_SLOTS = 0;
const INITIALIZE_FAILURE = -1;
const NOTHING_FREED = 0;
const FIRST_ATTEMPT = 0;
const ATTEMPT_STEP = 1;
const SERVICE_ATTEMPTS = 100;
const SERVICE_TIMEOUT_MS = 5;
const SESSION_ID = 1;
const MESSAGE = "freed message";
const address = localAddress(PORT);

const callbackSlots = (): number => koffi.stats().callbacks;

const failingInitializeWithCallbacks: typeof native.enet_initialize_with_callbacks =
  Object.assign((): number => INITIALIZE_FAILURE, {
    async: native.enet_initialize_with_callbacks.async,
    info: native.enet_initialize_with_callbacks.info,
  });

// Returns the packets ENet frees
const trackFrees = (packet: IENetPacket): readonly unknown[] => {
  const freed: unknown[] = [];

  packet.freeCallback = (freedPacket): void => {
    freed.push(freedPacket);
  };

  return freed;
};

const serviceUntilFreed = (
  host: IENetHost,
  freed: readonly unknown[],
): void => {
  for (
    let attempt = FIRST_ATTEMPT;
    attempt < SERVICE_ATTEMPTS && freed.length === NOTHING_FREED;
    attempt += ATTEMPT_STEP
  ) {
    enet.host.service(host, SERVICE_TIMEOUT_MS);
  }
};

describe("packet free callbacks", () => {
  it("run inside service once the remote host acknowledges the packet", () => {
    expect.hasAssertions();

    withConnection(address, ({ client, peer, server }) => {
      const packet = createPacket(Buffer.from(MESSAGE));
      const freed = trackFrees(packet);

      enet.peer.send(peer, CHANNEL, packet);
      enet.host.flush(client);
      enet.packet.destroy(receivePacket(server, client));
      serviceUntilFreed(client, freed);

      expect(freed).toStrictEqual([packet]);
      // The free callback getter reads only enet-js state, never the freed packet
      expect(packet.freeCallback).toBeNull();
    });
  });

  it("run inside host destroy for packets still queued", () => {
    expect.hasAssertions();

    withEnet(() => {
      const server = createServer(address);
      const client = createClient();

      withHosts([server], () => {
        const peer = connectPeer(client, address);
        const packet = createPacket(Buffer.from(MESSAGE));

        serviceUntil(server, client, ENetEventType.connect);

        const freed = trackFrees(packet);

        enet.peer.send(peer, CHANNEL, packet);
        enet.host.destroy(client);

        expect(freed).toStrictEqual([packet]);
      });
    });
  });
});

describe("initialize callbacks", () => {
  it("give their callback slots back when ENet refuses them", async () => {
    expect.hasAssertions();

    vi.resetModules();
    vi.doMock(import("./native/index.js"), () => ({
      ...native,
      enet_initialize_with_callbacks: failingInitializeWithCallbacks,
    }));

    const { initializeWithCallbacks } = await import("./global.js");
    const base = callbackSlots();

    expect([
      initializeWithCallbacks(ENET_VERSION, { noMemory: enet.deinitialize }),
      initializeWithCallbacks(ENET_VERSION, { rand: () => SESSION_ID }),
    ]).toStrictEqual([INITIALIZE_FAILURE, INITIALIZE_FAILURE]);
    expect(callbackSlots() - base).toBe(NO_SLOTS);
  });
});
