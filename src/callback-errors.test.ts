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
import type { IENetHost, IENetPeer } from "./index.js";
import { ENetEventType, ENetPacketFlag, enet } from "./index.js";

vi.setConfig({ testTimeout: 10_000 });

const PORT = 9105;
const DISCONNECT_DATA = 0;
const MESSAGE = "queued message";
const FREE_ERROR = "free callback failed";
const address = localAddress(PORT);

// Queues a packet whose free callback throws, so a call that discards queued packets runs it
const queueThrowingPacket = (peer: IENetPeer): void => {
  const packet = createPacket(Buffer.from(MESSAGE));

  packet.freeCallback = (): never => {
    throw new Error(FREE_ERROR);
  };
  enet.peer.send(peer, CHANNEL, packet);
};

const withClient = (run: (client: IENetHost) => void): void => {
  withEnet(() => {
    const client = createClient();

    withHosts([client], () => {
      run(client);
    });
  });
};

describe("peer calls that discard queued packets", () => {
  it.each([
    { name: "reset", run: enet.peer.reset },
    {
      name: "disconnect",
      run: (peer: IENetPeer): void => {
        enet.peer.disconnect(peer, DISCONNECT_DATA);
      },
    },
    {
      name: "disconnectNow",
      run: (peer: IENetPeer): void => {
        enet.peer.disconnectNow(peer, DISCONNECT_DATA);
      },
    },
  ] as const)(
    "$name rethrows an error from a packet's free callback",
    ({ run }) => {
      expect.hasAssertions();

      withConnection(address, ({ peer }) => {
        queueThrowingPacket(peer);

        expect(() => {
          run(peer);
        }).toThrow(FREE_ERROR);
      });
    },
  );
});

describe("host calls that send packets", () => {
  it("flush rethrows an error from the free callback of a sent unreliable packet", () => {
    expect.hasAssertions();

    withConnection(address, ({ client, peer }) => {
      const packet = createPacket(Buffer.from(MESSAGE), ENetPacketFlag.none);

      packet.freeCallback = (): never => {
        throw new Error(FREE_ERROR);
      };
      enet.peer.send(peer, CHANNEL, packet);

      expect(() => {
        enet.host.flush(client);
      }).toThrow(FREE_ERROR);
    });
  });
});

describe("host calls that free packets", () => {
  it("destroy rethrows an error from a queued packet's free callback", () => {
    expect.hasAssertions();

    withEnet(() => {
      const server = createServer(address);
      const client = createClient();

      withHosts([server], () => {
        const peer = connectPeer(client, address);

        serviceUntil(server, client, ENetEventType.connect);
        queueThrowingPacket(peer);

        expect(() => {
          enet.host.destroy(client);
        }).toThrow(FREE_ERROR);
      });
    });
  });

  it("broadcast rethrows an error when ENet frees a packet no peer took", () => {
    expect.hasAssertions();

    withClient((client) => {
      const packet = createPacket(Buffer.from(MESSAGE));

      packet.freeCallback = (): never => {
        throw new Error(FREE_ERROR);
      };

      expect(() => {
        enet.host.broadcast(client, CHANNEL, packet);
      }).toThrow(FREE_ERROR);
    });
  });
});
