import { describe, expect, it, vi } from "vitest";

import {
  CHANNEL,
  createClient,
  createPacket,
  localAddress,
  receivePacket,
  withConnection,
  withEnet,
  withHosts,
} from "./fixtures.js";
import type { IENetCompressor } from "./index.js";
import { enet } from "./index.js";
import { nonNull } from "./util.js";

vi.setConfig({ testTimeout: 10_000 });

const PORT = 9104;
const SUCCESS = 0;
const UNCOMPRESSED = 0;
const PAYLOAD_LENGTH = 1000;
const PAYLOAD = Buffer.alloc(PAYLOAD_LENGTH, "compressible ");
const MESSAGE = "compress failed";
const address = localAddress(PORT);

// A JS compressor that hands its work to a range coder of its own
const rangeCoderCompressor = (onDestroy: () => void): IENetCompressor => {
  const rangeCoder = nonNull(
    enet.rangeCoder.create(),
    "Unable to create a range coder",
  );

  return {
    compress: (inBuffers, inLimit, outData, outLimit) =>
      enet.rangeCoder.compress(
        rangeCoder,
        inBuffers,
        inLimit,
        outData,
        outLimit,
      ),
    decompress: (inData, inLimit, outData, outLimit) =>
      enet.rangeCoder.decompress(
        rangeCoder,
        inData,
        inLimit,
        outData,
        outLimit,
      ),
    destroy: () => {
      enet.rangeCoder.destroy(rangeCoder);
      onDestroy();
    },
  };
};

describe("host compression", () => {
  it("delivers packets compressed with ENet's range coder", () => {
    expect.hasAssertions();

    withConnection(address, ({ client, peer, server }) => {
      expect([
        enet.host.compressWithRangeCoder(client),
        enet.host.compressWithRangeCoder(server),
      ]).toStrictEqual([SUCCESS, SUCCESS]);

      enet.peer.send(peer, CHANNEL, createPacket(PAYLOAD));
      enet.host.flush(client);

      expect(receivePacket(server, client).data).toStrictEqual(PAYLOAD);
      expect(client.totalSentData).toBeLessThan(PAYLOAD.length);
    });
  });

  it("delivers packets through JS compressors and destroys them with the hosts", () => {
    expect.hasAssertions();

    const destroyed: string[] = [];

    withConnection(address, ({ client, peer, server }) => {
      enet.host.compress(
        client,
        rangeCoderCompressor(() => {
          destroyed.push(MESSAGE);
        }),
      );
      enet.host.compress(
        server,
        rangeCoderCompressor(() => {
          destroyed.push(MESSAGE);
        }),
      );
      enet.peer.send(peer, CHANNEL, createPacket(PAYLOAD));
      enet.host.flush(client);

      expect(receivePacket(server, client).data).toStrictEqual(PAYLOAD);
      expect(client.totalSentData).toBeLessThan(PAYLOAD.length);
    });

    expect(destroyed).toStrictEqual([MESSAGE, MESSAGE]);
  });
});

describe("host compressor replacement", () => {
  it("destroys a JS compressor when it is replaced or disabled", () => {
    expect.hasAssertions();

    withEnet(() => {
      const host = createClient();
      const destroyed: string[] = [];

      withHosts([host], () => {
        enet.host.compress(host, {
          compress: () => UNCOMPRESSED,
          decompress: () => UNCOMPRESSED,
        });
        enet.host.compress(
          host,
          rangeCoderCompressor(() => {
            destroyed.push(MESSAGE);
          }),
        );

        expect(destroyed).toStrictEqual([]);

        enet.host.compress(host, null);

        expect(destroyed).toStrictEqual([MESSAGE]);
      });
    });
  });

  it("rethrows an error from a compressor once the call returns", () => {
    expect.hasAssertions();

    withConnection(address, ({ client, peer }) => {
      enet.host.compress(client, {
        compress: () => {
          throw new Error(MESSAGE);
        },
        decompress: () => UNCOMPRESSED,
      });
      enet.peer.send(peer, CHANNEL, createPacket(PAYLOAD));

      expect(() => {
        enet.host.flush(client);
      }).toThrow(MESSAGE);
    });
  });
});
