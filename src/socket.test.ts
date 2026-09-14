import { describe, expect, it, vi } from "vitest";

import { localAddress } from "./fixtures.js";
import {
  ENET_SOCKET_NULL,
  ENetSocketOption,
  ENetSocketType,
  ENetSocketWait,
  enet,
} from "./index.js";
import { nonNull } from "./util.js";

vi.setConfig({ testTimeout: 10_000 });

const DATAGRAM_PORT = 9110;
const STREAM_PORT = 9111;
const IDLE_STREAM_PORT = 9112;
const SUCCESS = 0;
const ENABLED = 1;
const NOTHING_RECEIVED = 0;
const WAIT_MS = 1000;
const BACKLOG = 1;
const HELLO = "hello ";
const WORLD = "world";
const FIRST_LENGTH = 8;
const SECOND_LENGTH = 64;
const START = 0;

const withSockets = (
  types: readonly ENetSocketType[],
  run: (sockets: readonly number[]) => void,
): void => {
  const sockets = types.map((type) => enet.socket.create(type));

  try {
    run(sockets);
  } finally {
    for (const socket of sockets) {
      enet.socket.destroy(socket);
    }
  }
};

describe("datagram sockets", () => {
  it("sends Buffers to a bound socket and receives them into Buffers", () => {
    expect.hasAssertions();

    withSockets(
      [ENetSocketType.datagram, ENetSocketType.datagram],
      ([receiver = ENET_SOCKET_NULL, sender = ENET_SOCKET_NULL]) => {
        const address = localAddress(DATAGRAM_PORT);
        const first = Buffer.alloc(FIRST_LENGTH);
        const second = Buffer.alloc(SECOND_LENGTH);

        enet.socket.bind(receiver, address);

        expect(
          enet.socket.send(sender, address, [
            Buffer.from(HELLO),
            Buffer.from(WORLD),
          ]),
        ).toBe(HELLO.length + WORLD.length);
        expect(
          enet.socket.wait(receiver, ENetSocketWait.receive, WAIT_MS),
        ).toBe(ENetSocketWait.receive);

        const { address: senderAddress, result } = enet.socket.receive(
          receiver,
          [first, second],
        );

        expect(result).toBe(HELLO.length + WORLD.length);
        expect(senderAddress?.host).toBe(address.host);
        expect(
          Buffer.concat([first, second]).subarray(START, result).toString(),
        ).toBe(HELLO + WORLD);
      },
    );
  });
});

describe("socket options", () => {
  it("sets socket options", () => {
    expect.hasAssertions();

    withSockets([ENetSocketType.datagram], ([socket = ENET_SOCKET_NULL]) => {
      expect(enet.socket.bind(socket, null)).toBe(SUCCESS);
      expect(
        enet.socket.setOption(socket, ENetSocketOption.nonblock, ENABLED),
      ).toBe(SUCCESS);
      expect(
        enet.socket.setOption(socket, ENetSocketOption.broadcast, ENABLED),
      ).toBe(SUCCESS);
      expect(
        enet.socket.receive(socket, [Buffer.alloc(FIRST_LENGTH)]),
      ).toStrictEqual({ address: null, result: NOTHING_RECEIVED });
    });
  });
});

describe("stream sockets", () => {
  it("accepts a connection and sends on the connected socket", () => {
    expect.hasAssertions();

    withSockets(
      [ENetSocketType.stream, ENetSocketType.stream],
      ([listener = ENET_SOCKET_NULL, client = ENET_SOCKET_NULL]) => {
        const address = localAddress(STREAM_PORT);

        enet.socket.setOption(listener, ENetSocketOption.reuseaddr, ENABLED);
        enet.socket.bind(listener, address);

        expect(enet.socket.listen(listener, BACKLOG)).toBe(SUCCESS);
        expect(enet.socket.connect(client, address)).toBe(SUCCESS);

        const accepted = nonNull(
          enet.socket.accept(listener),
          "No connection to accept",
        );

        expect(accepted.address.host).toBe(address.host);
        expect(enet.socket.send(client, null, [Buffer.from(HELLO)])).toBe(
          HELLO.length,
        );

        enet.socket.destroy(accepted.socket);
      },
    );
  });

  it("returns null when no connection is waiting", () => {
    expect.hasAssertions();

    withSockets([ENetSocketType.stream], ([listener = ENET_SOCKET_NULL]) => {
      enet.socket.setOption(listener, ENetSocketOption.reuseaddr, ENABLED);
      enet.socket.bind(listener, localAddress(IDLE_STREAM_PORT));
      enet.socket.listen(listener, BACKLOG);
      enet.socket.setOption(listener, ENetSocketOption.nonblock, ENABLED);

      expect(enet.socket.accept(listener)).toBeNull();
    });
  });
});
