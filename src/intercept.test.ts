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
import { ENetEventType } from "./index.js";

vi.setConfig({ testTimeout: 10_000 });

const PORT = 9103;
const IGNORE = 0;
const FAIL = -1;
const NOTHING = 0;
const MESSAGE = "intercept failed";
const address = localAddress(PORT);

interface Datagram {
  readonly host: IENetHost;
  readonly length: number;
  readonly sender: string;
  readonly total: number;
}

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

describe("host intercept", () => {
  it("sees each datagram and its sender, then lets ENet process it", () => {
    expect.hasAssertions();

    withHostPair((server, client) => {
      const datagrams: Datagram[] = [];

      server.intercept = (host, data, sender): number => {
        datagrams.push({
          host,
          length: data.length,
          sender: sender.host,
          total: host.totalReceivedData,
        });

        return IGNORE;
      };
      connectPeer(client, address);

      expect(serviceUntil(server, client, ENetEventType.connect).type).toBe(
        ENetEventType.connect,
      );

      const [first] = datagrams;

      expect(first?.host).toBe(server);
      expect(first).toMatchObject({
        length: first?.total,
        sender: address.host,
      });
      expect(first?.length).toBeGreaterThan(NOTHING);
      expect(server.intercept).toBeTypeOf("function");
    });
  });

  it("stops the host from seeing events when it fails", () => {
    expect.hasAssertions();

    withHostPair((server, client) => {
      server.intercept = (): number => FAIL;
      connectPeer(client, address);

      expect(() => serviceUntil(server, client, ENetEventType.connect)).toThrow(
        "No event",
      );
    });
  });
});

describe("host intercept changes", () => {
  it("clears the intercept with null", () => {
    expect.hasAssertions();

    withHostPair((server) => {
      server.intercept = (): number => IGNORE;
      server.intercept = null;

      expect(server.intercept).toBeNull();
    });
  });

  it("rethrows an error from the intercept once service returns", () => {
    expect.hasAssertions();

    withHostPair((server, client) => {
      server.intercept = (): never => {
        throw new Error(MESSAGE);
      };
      connectPeer(client, address);

      expect(() => serviceUntil(server, client, ENetEventType.connect)).toThrow(
        MESSAGE,
      );
    });
  });
});
