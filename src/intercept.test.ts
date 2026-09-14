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
import { ENetEventType, ENetSocketType, enet } from "./index.js";

vi.setConfig({ testTimeout: 10_000 });

const PORT = 9103;
const IGNORE = 0;
const FAIL = -1;
const CONSUME = 1;
const NO_WAIT = 0;
const ONE_CALL = 1;
const DATAGRAMS = 3;
const DATAGRAM = "not an ENet datagram";
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

// Queues datagrams on the server's socket, then counts the intercept calls one service makes
const interceptCallsInOneService = (
  server: IENetHost,
  verdict: number,
): number => {
  const sender = enet.socket.create(ENetSocketType.datagram);
  const calls: number[] = [];

  server.intercept = (_host, data): number => {
    calls.push(data.length);

    return verdict;
  };

  try {
    for (const datagram of Array.from({ length: DATAGRAMS }, () => DATAGRAM)) {
      enet.socket.send(sender, address, [Buffer.from(datagram)]);
    }

    enet.host.service(server, NO_WAIT);
  } finally {
    enet.socket.destroy(sender);
  }

  return calls.length;
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
});

describe("host intercept results", () => {
  it("stops service at the first datagram when it returns -1", () => {
    expect.hasAssertions();

    withHostPair((server) => {
      expect(interceptCallsInOneService(server, FAIL)).toBe(ONE_CALL);
    });
  });

  it("lets service go on to the next datagram when it returns 1", () => {
    expect.hasAssertions();

    withHostPair((server) => {
      expect(interceptCallsInOneService(server, CONSUME)).toBe(DATAGRAMS);
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
