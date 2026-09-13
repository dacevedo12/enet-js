import { describe, expect, it, vi } from "vitest";

import {
  ENET_PORT_ANY,
  ENET_SOCKET_NULL,
  ENetSocketOption,
  ENetSocketShutdown,
  ENetSocketType,
  ENetSocketWait,
  enet,
} from "./index.js";
import { nonNull } from "./util.js";

vi.setConfig({ testTimeout: 10_000 });

const LOCALHOST = { host: "127.0.0.1", port: ENET_PORT_ANY };
const SUCCESS = 0;
const ENABLED = 1;
const NO_ERROR = 0;
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
        enet.socket.bind(receiver, LOCALHOST);

        const address = nonNull(
          enet.socket.getAddress(receiver),
          "Unable to read the socket address",
        );
        const first = Buffer.alloc(FIRST_LENGTH);
        const second = Buffer.alloc(SECOND_LENGTH);

        expect(
          enet.socket.send(sender, address, [
            Buffer.from(HELLO),
            Buffer.from(WORLD),
          ]),
        ).toBe(HELLO.length + WORLD.length);
        expect(
          enet.socket.wait(receiver, ENetSocketWait.receive, WAIT_MS),
        ).toBe(ENetSocketWait.receive);

        const { address: sender_address, result } = enet.socket.receive(
          receiver,
          [first, second],
        );

        expect(result).toBe(HELLO.length + WORLD.length);
        expect(sender_address.host).toBe(LOCALHOST.host);
        expect(
          Buffer.concat([first, second]).subarray(START, result).toString(),
        ).toBe(HELLO + WORLD);
      },
    );
  });
});

describe("socket options", () => {
  it("sets and reads socket options", () => {
    expect.hasAssertions();

    withSockets([ENetSocketType.datagram], ([socket = ENET_SOCKET_NULL]) => {
      expect(enet.socket.bind(socket, null)).toBe(SUCCESS);
      expect(
        enet.socket.setOption(socket, ENetSocketOption.nonblock, ENABLED),
      ).toBe(SUCCESS);
      expect(enet.socket.getOption(socket, ENetSocketOption.error)).toBe(
        NO_ERROR,
      );
      expect(
        enet.socket.getOption(socket, ENetSocketOption.nonblock),
      ).toBeNull();
      expect(
        enet.socket.receive(socket, [Buffer.alloc(FIRST_LENGTH)]).result,
      ).toBe(NOTHING_RECEIVED);
    });
  });

  it("returns null for the address of a closed socket", () => {
    expect.hasAssertions();

    const socket = enet.socket.create(ENetSocketType.datagram);

    enet.socket.destroy(socket);

    expect(enet.socket.getAddress(socket)).toBeNull();
  });
});

describe("stream sockets", () => {
  it("accepts a connection and sends on the connected socket", () => {
    expect.hasAssertions();

    withSockets(
      [ENetSocketType.stream, ENetSocketType.stream],
      ([listener = ENET_SOCKET_NULL, client = ENET_SOCKET_NULL]) => {
        enet.socket.bind(listener, LOCALHOST);

        expect(enet.socket.listen(listener, BACKLOG)).toBe(SUCCESS);

        const address = nonNull(
          enet.socket.getAddress(listener),
          "Unable to read the socket address",
        );

        expect(enet.socket.connect(client, address)).toBe(SUCCESS);

        const accepted = nonNull(
          enet.socket.accept(listener),
          "No connection to accept",
        );

        expect(accepted.address.host).toBe(LOCALHOST.host);
        expect(enet.socket.send(client, null, [Buffer.from(HELLO)])).toBe(
          HELLO.length,
        );
        expect(
          enet.socket.shutdown(accepted.socket, ENetSocketShutdown.readWrite),
        ).toBe(SUCCESS);

        enet.socket.destroy(accepted.socket);
      },
    );
  });

  it("returns null when no connection is waiting", () => {
    expect.hasAssertions();

    withSockets([ENetSocketType.stream], ([listener = ENET_SOCKET_NULL]) => {
      enet.socket.bind(listener, LOCALHOST);
      enet.socket.listen(listener, BACKLOG);
      enet.socket.setOption(listener, ENetSocketOption.nonblock, ENABLED);

      expect(enet.socket.accept(listener)).toBeNull();
    });
  });
});
