import { setImmediate as nextTurn } from "node:timers/promises";
import { setFlagsFromString } from "node:v8";
import { runInNewContext } from "node:vm";

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
import type {
  ENetChecksumCallback,
  IENetCompressor,
  IENetHost,
  IENetPacket,
} from "./index.js";
import { ENET_VERSION_CREATE, ENetEventType, enet } from "./index.js";

vi.setConfig({ testTimeout: 10_000 });

const PORT = 9106;
const NO_SLOTS = 0;
const ONE_SLOT = 1;
const IGNORE = 0;
const UNCOMPRESSED = 0;
const INITIALIZE_FAILURE = -1;
const NOTHING_FREED = 0;
const FIRST_ATTEMPT = 0;
const ATTEMPT_STEP = 1;
const SERVICE_ATTEMPTS = 100;
const SERVICE_TIMEOUT_MS = 5;
const OLD_MAJOR = 1;
const OLD_MINOR = 2;
const OLD_PATCH = 0;
const MESSAGE = "freed message";
const DESTROYED = "destroyed";
const USER_DATA = { player: "one" };
const address = localAddress(PORT);

const callbackSlots = (): number => koffi.stats().callbacks;

const checksumOne: ENetChecksumCallback = (buffers) => enet.crc32(buffers);
const checksumTwo: ENetChecksumCallback = (buffers) => enet.crc32(buffers);

// Returns the packets ENet frees, each followed by its user data
const trackFrees = (packet: IENetPacket): readonly unknown[] => {
  const freed: unknown[] = [];

  packet.userData = USER_DATA;
  packet.freeCallback = (freedPacket): void => {
    freed.push(freedPacket, freedPacket.userData);
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

// Gives a compressor to a host and destroys the host, keeping only a weak reference to the compressor
const compressAndDestroy = (
  onDestroy: () => void,
): WeakRef<IENetCompressor> => {
  const compressor: IENetCompressor = {
    compress: (): number => UNCOMPRESSED,
    decompress: (): number => UNCOMPRESSED,
    destroy: onDestroy,
  };

  withEnet(() => {
    const host = createClient();

    enet.host.compress(host, compressor);
    enet.host.destroy(host);
  });

  return new WeakRef(compressor);
};

describe("checksum callbacks", () => {
  it("hold one callback slot per host until replaced, cleared or destroyed", () => {
    expect.hasAssertions();

    withEnet(() => {
      const host = createClient();
      const base = callbackSlots();
      const assignments = [
        checksumOne,
        checksumTwo,
        enet.crc32,
        checksumOne,
        null,
        checksumOne,
      ] as const;
      const slots = assignments.map((checksum) => {
        host.checksum = checksum;

        return callbackSlots() - base;
      });

      enet.host.destroy(host);

      expect([...slots, callbackSlots() - base]).toStrictEqual([
        ONE_SLOT,
        ONE_SLOT,
        NO_SLOTS,
        ONE_SLOT,
        NO_SLOTS,
        ONE_SLOT,
        NO_SLOTS,
      ]);
    });
  });
});

describe("intercept callbacks", () => {
  it("are dropped when their host is destroyed", () => {
    expect.hasAssertions();

    withEnet(() => {
      const host = createClient();

      host.intercept = (): number => IGNORE;
      enet.host.destroy(host);

      // The intercept getter reads only enet-js state, never the freed host
      expect(host.intercept).toBeNull();
    });
  });
});

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

      expect(freed).toStrictEqual([packet, USER_DATA]);
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

        expect(freed).toStrictEqual([packet, USER_DATA]);
      });
    });
  });
});

describe("compressor callbacks", () => {
  it("destroy a compressor once, then forget it", async () => {
    expect.hasAssertions();

    setFlagsFromString("--expose-gc");

    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- the gc function V8 exposes with --expose-gc takes no arguments
    const collectGarbage = runInNewContext("gc") as () => void;
    const destroyed: string[] = [];
    const compressor = compressAndDestroy(() => {
      destroyed.push(DESTROYED);
    });

    // WeakRef targets stay alive until the current job ends
    await nextTurn();

    collectGarbage();

    expect(destroyed).toStrictEqual([DESTROYED]);
    expect(compressor.deref()).toBeUndefined();
  });
});

describe("noMemory callbacks", () => {
  it("give their callback slot back when ENet refuses the callbacks", () => {
    expect.hasAssertions();

    const base = callbackSlots();

    expect(
      enet.initializeWithCallbacks(
        ENET_VERSION_CREATE(OLD_MAJOR, OLD_MINOR, OLD_PATCH),
        { noMemory: enet.deinitialize },
      ),
    ).toBe(INITIALIZE_FAILURE);
    expect(callbackSlots() - base).toBe(NO_SLOTS);
  });
});
