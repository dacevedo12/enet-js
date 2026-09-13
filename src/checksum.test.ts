import { describe, expect, it, vi } from "vitest";

import {
  connectPeer,
  createClient,
  createServer,
  localAddress,
  serviceUntil,
  withEnet,
  withHosts,
} from "./fixtures.js";
import type { IENetHost } from "./index.js";
import { ENetEventType, enet } from "./index.js";

vi.setConfig({ testTimeout: 10_000 });

const PORT = 9102;
const NO_CALLS = 0;
const MESSAGE = "checksum failed";
const address = localAddress(PORT);

const withHostPair = (
  run: (server: IENetHost, client: IENetHost) => void,
): void => {
  withEnet(() => {
    const server = createServer(address);
    const client = createClient();

    withHosts([client, server], () => {
      run(server, client);
    });
  });
};

describe("host checksum", () => {
  it("connects when both hosts use ENet's crc32", () => {
    expect.hasAssertions();

    withHostPair((server, client) => {
      server.checksum = enet.crc32;
      client.checksum = enet.crc32;
      connectPeer(client, address);

      expect(client.checksum).toBe(enet.crc32);
      expect(serviceUntil(server, client, ENetEventType.connect).type).toBe(
        ENetEventType.connect,
      );
    });
  });

  it("connects when both hosts use the same JS checksum", () => {
    expect.hasAssertions();

    withHostPair((server, client) => {
      const counts: number[] = [];
      const checksum = (buffers: readonly Buffer[]): number => {
        counts.push(buffers.length);

        return enet.crc32(buffers);
      };

      server.checksum = checksum;
      client.checksum = checksum;
      connectPeer(client, address);

      expect(server.checksum).toBe(checksum);
      expect(serviceUntil(server, client, ENetEventType.connect).type).toBe(
        ENetEventType.connect,
      );
      expect(counts.length).toBeGreaterThan(NO_CALLS);
    });
  });
});

describe("host checksum changes", () => {
  it("replaces and clears a checksum", () => {
    expect.hasAssertions();

    withHostPair((server) => {
      const first = (): number => NO_CALLS;
      const second = (): number => NO_CALLS;

      server.checksum = first;
      server.checksum = second;

      expect(server.checksum).toBe(second);

      server.checksum = null;

      expect(server.checksum).toBeNull();
    });
  });

  it("rethrows an error from a checksum once the call returns", () => {
    expect.hasAssertions();

    withHostPair((_server, client) => {
      client.checksum = (): never => {
        throw new Error(MESSAGE);
      };
      connectPeer(client, address);

      expect(() => {
        enet.host.flush(client);
      }).toThrow(MESSAGE);
    });
  });
});
