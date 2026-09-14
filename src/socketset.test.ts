import { describe, expect, it, vi } from "vitest";

import { localAddress } from "./fixtures.js";
import { ENetSocketType, enet } from "./index.js";
import { posixSocketSet, windowsSocketSet } from "./socketset.js";

vi.setConfig({ testTimeout: 10_000 });

const PORT = 9113;
const address = localAddress(PORT);
const WAIT_MS = 1000;
const READY_IN_BOTH_SETS = 2;
const READY_IN_ONE_SET = 1;
const MESSAGE = "select me";
const LOW_SOCKET = 3;
const MIDDLE_SOCKET = 9;
const HIGH_SOCKET = 64;
const NOT_READY = 100;
const SOCKETS = [LOW_SOCKET, MIDDLE_SOCKET, HIGH_SOCKET];

// A datagram receiver with a datagram waiting, and the socket that sent it
const withReadyReceiver = (
  run: (receiver: number, sender: number) => void,
): void => {
  const receiver = enet.socket.create(ENetSocketType.datagram);
  const sender = enet.socket.create(ENetSocketType.datagram);

  try {
    enet.socket.bind(receiver, address);
    enet.socket.send(sender, address, [Buffer.from(MESSAGE)]);
    run(receiver, sender);
  } finally {
    enet.socket.destroy(receiver);
    enet.socket.destroy(sender);
  }
};

describe("socketset select", () => {
  it("keeps the sockets that are ready and removes the others", () => {
    expect.hasAssertions();

    withReadyReceiver((receiver, sender) => {
      const readSet = new Set([receiver, sender]);
      const writeSet = new Set([sender]);

      expect(
        enet.socketset.select(
          Math.max(receiver, sender),
          readSet,
          writeSet,
          WAIT_MS,
        ),
      ).toBe(READY_IN_BOTH_SETS);
      expect([...readSet]).toStrictEqual([receiver]);
      expect([...writeSet]).toStrictEqual([sender]);
    });
  });

  it("accepts null for a set", () => {
    expect.hasAssertions();

    withReadyReceiver((receiver, sender) => {
      expect(
        enet.socketset.select(
          Math.max(receiver, sender),
          null,
          new Set([sender]),
          WAIT_MS,
        ),
      ).toBe(READY_IN_ONE_SET);
    });
  });
});

describe("fd_set layouts", () => {
  it.each([
    { layout: posixSocketSet, name: "POSIX" },
    { layout: windowsSocketSet, name: "Windows" },
  ] as const)(
    "$name keeps only the sockets in the encoded set",
    ({ layout }) => {
      expect.hasAssertions();

      const sockets = new Set([...SOCKETS, NOT_READY]);

      layout.decode(layout.encode(new Set(SOCKETS)), sockets);

      expect([...sockets]).toStrictEqual(SOCKETS);
    },
  );
});
