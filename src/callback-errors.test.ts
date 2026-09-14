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
import type { IENetCompressor, IENetHost, IENetPeer } from "./index.js";
import { ENetEventType, enet } from "./index.js";

vi.setConfig({ testTimeout: 10_000 });

const PORT = 9105;
const DISCONNECT_DATA = 0;
const UNCOMPRESSED = 0;
const MESSAGE = "queued message";
const FREE_ERROR = "free callback failed";
const DESTROY_ERROR = "compressor destroy failed";
const CHECKSUM_ERROR = "checksum failed";
const address = localAddress(PORT);

// Queues a packet whose free callback throws, so a call that discards queued packets runs it
const queueThrowingPacket = (peer: IENetPeer): void => {
  const packet = createPacket(Buffer.from(MESSAGE));

  packet.freeCallback = (): never => {
    throw new Error(FREE_ERROR);
  };
  enet.peer.send(peer, CHANNEL, packet);
};

const throwingDestroyCompressor: IENetCompressor = {
  compress: (): number => UNCOMPRESSED,
  decompress: (): number => UNCOMPRESSED,
  destroy: (): never => {
    throw new Error(DESTROY_ERROR);
  },
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

  it("disconnectLater rethrows an error from the checksum of the disconnect it sends", () => {
    expect.hasAssertions();

    withClient((client) => {
      const peer = connectPeer(client, address);

      client.checksum = (): never => {
        throw new Error(CHECKSUM_ERROR);
      };

      expect(() => {
        enet.peer.disconnectLater(peer, DISCONNECT_DATA);
      }).toThrow(CHECKSUM_ERROR);
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

describe("host calls that destroy compressors", () => {
  it("destroy rethrows an error from a compressor's destroy", () => {
    expect.hasAssertions();

    withEnet(() => {
      const client = createClient();

      enet.host.compress(client, throwingDestroyCompressor);

      expect(() => {
        enet.host.destroy(client);
      }).toThrow(DESTROY_ERROR);
    });
  });

  it("compress rethrows an error from the destroy of the compressor it replaces", () => {
    expect.hasAssertions();

    withClient((client) => {
      enet.host.compress(client, throwingDestroyCompressor);

      expect(() => {
        enet.host.compress(client, null);
      }).toThrow(DESTROY_ERROR);
    });
  });

  it("compressWithRangeCoder rethrows an error from the destroy of the compressor it replaces", () => {
    expect.hasAssertions();

    withClient((client) => {
      enet.host.compress(client, throwingDestroyCompressor);

      expect(() => enet.host.compressWithRangeCoder(client)).toThrow(
        DESTROY_ERROR,
      );
    });
  });
});

describe("callback results", () => {
  it("rethrows a TypeError when a callback returns something other than a number", () => {
    expect.hasAssertions();

    withClient((client) => {
      connectPeer(client, address);
      // JavaScript callers can return anything, which the setter's type would reject
      Reflect.set(client, "checksum", () => "0");

      expect(() => {
        enet.host.flush(client);
      }).toThrow("returned string to ENet instead of a number");
    });
  });
});
