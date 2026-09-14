import { describe, expect, it, vi } from "vitest";

import {
  connectPeer,
  createClient,
  localAddress,
  withEnet,
  withHosts,
} from "./fixtures.js";
import type { IENetHost } from "./index.js";
import { ENET_VERSION, enet } from "./index.js";

vi.setConfig({ testTimeout: 10_000 });

// ENet keeps the rand callback for the rest of the process, so these tests run in order and each installs its own
const PORT = 9114;
const INITIALIZE_SUCCESS = 0;
const SESSION_ID = 1234;
const RAND_ERROR = "rand failed";
const address = localAddress(PORT);

const withRand = (
  rand: () => unknown,
  run: (client: IENetHost) => void,
): void => {
  // JavaScript callers can return anything, which the rand type would reject
  const inits = Object.fromEntries([["rand", rand]]);

  expect(enet.initializeWithCallbacks(ENET_VERSION, inits)).toBe(
    INITIALIZE_SUCCESS,
  );

  withEnet(() => {
    const client = createClient();

    withHosts([client], () => {
      run(client);
    });
  });
};

describe("rand callbacks", () => {
  it("are called for each connection's session ID", () => {
    expect.hasAssertions();

    const calls: number[] = [];

    withRand(
      (): number => {
        calls.push(SESSION_ID);

        return SESSION_ID;
      },
      (client) => {
        connectPeer(client, address);
      },
    );

    expect(calls).toStrictEqual([SESSION_ID]);
  });

  it("rethrow a TypeError from connect when they return something other than a number", () => {
    expect.hasAssertions();

    withRand(
      () => String(SESSION_ID),
      (client) => {
        expect(() => connectPeer(client, address)).toThrow(
          "returned string to ENet instead of a number",
        );
      },
    );
  });

  it("rethrow their error from connect", () => {
    expect.hasAssertions();

    withRand(
      (): never => {
        throw new Error(RAND_ERROR);
      },
      (client) => {
        expect(() => connectPeer(client, address)).toThrow(RAND_ERROR);
      },
    );
  });
});
