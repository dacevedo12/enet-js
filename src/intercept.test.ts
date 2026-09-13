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
const FIRST_HOST = 0;
const MESSAGE = "intercept failed";
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

describe("host intercept", () => {
  it("sees each datagram with its host, then lets ENet process it", () => {
    expect.hasAssertions();

    withHostPair((server, client) => {
      const hosts: IENetHost[] = [];

      server.intercept = (host): number => {
        hosts.push(host);

        return IGNORE;
      };
      connectPeer(client, address);

      expect(serviceUntil(server, client, ENetEventType.connect).type).toBe(
        ENetEventType.connect,
      );
      expect(hosts[FIRST_HOST]).toBe(server);
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
