import koffi from "koffi";

import { enet_socketset_select } from "./native/index.js";
import { readNumber } from "./util.js";

// How an fd_set is laid out, standing in for the FD_* macros behind ENET_SOCKETSET_*
interface SocketSetLayout {
  // Removes the sockets that select didn't mark as ready
  readonly decode: (fdSet: Buffer, sockets: Set<number>) => void;
  readonly encode: (sockets: ReadonlySet<number>) => Buffer;
}

// A POSIX fd_set is a bitmask of FD_SETSIZE (1024) sockets
const POSIX_FD_SET_SIZE = 128;
const BITS_PER_BYTE = 8;
const BIT_BASE = 2;
const SET_BIT = 1;

// A Windows fd_set is a count and an array of FD_SETSIZE sockets, which Winsock defaults to 64
const WINDOWS_FD_SETSIZE = 64;
const windowsFdSet = koffi.struct({
  count: "uint",
  sockets: koffi.array("intptr_t", WINDOWS_FD_SETSIZE),
});
const WINDOWS_COUNT_OFFSET = koffi.offsetof(windowsFdSet, "count");
const WINDOWS_SOCKETS_OFFSET = koffi.offsetof(windowsFdSet, "sockets");
const WINDOWS_SOCKET_SIZE = koffi.sizeof("intptr_t");

const bitOf = (socket: number): number => BIT_BASE ** (socket % BITS_PER_BYTE);

const byteOf = (socket: number): number => Math.floor(socket / BITS_PER_BYTE);

const posixSocketSet: SocketSetLayout = {
  decode: (fdSet, sockets) => {
    for (const socket of sockets) {
      const byte = fdSet.readUInt8(byteOf(socket));

      if (Math.floor(byte / bitOf(socket)) % BIT_BASE !== SET_BIT) {
        sockets.delete(socket);
      }
    }
  },
  encode: (sockets) => {
    const fdSet = Buffer.alloc(POSIX_FD_SET_SIZE);

    for (const socket of sockets) {
      const byte = byteOf(socket);

      fdSet.writeUInt8(fdSet.readUInt8(byte) + bitOf(socket), byte);
    }

    return fdSet;
  },
};

const windowsSocketSet: SocketSetLayout = {
  decode: (fdSet, sockets) => {
    const ready = new Set(
      Array.from(
        { length: readNumber(fdSet, WINDOWS_COUNT_OFFSET, "uint") },
        (_socket, index) =>
          readNumber(
            fdSet,
            WINDOWS_SOCKETS_OFFSET + index * WINDOWS_SOCKET_SIZE,
            "intptr_t",
          ),
      ),
    );

    for (const socket of sockets) {
      if (!ready.has(socket)) {
        sockets.delete(socket);
      }
    }
  },
  encode: (sockets) => {
    const fdSet = Buffer.alloc(koffi.sizeof(windowsFdSet));

    koffi.encode(fdSet, WINDOWS_COUNT_OFFSET, "uint", sockets.size);

    for (const [index, socket] of [...sockets].entries()) {
      koffi.encode(
        fdSet,
        WINDOWS_SOCKETS_OFFSET + index * WINDOWS_SOCKET_SIZE,
        "intptr_t",
        socket,
      );
    }

    return fdSet;
  },
};

const layouts: Readonly<Partial<Record<NodeJS.Platform, SocketSetLayout>>> = {
  win32: windowsSocketSet,
};

const layout = layouts[process.platform] ?? posixSocketSet;

const toFdSet = (sockets: ReadonlySet<number> | null): Buffer | null =>
  sockets === null ? null : layout.encode(sockets);

const fromFdSet = (fdSet: Buffer | null, sockets: Set<number> | null): void => {
  if (fdSet !== null && sockets !== null) {
    layout.decode(fdSet, sockets);
  }
};

// Like enet_socketset_select: the sets hold sockets, and select removes the ones that aren't ready
const select = (
  maxSocket: number,
  readSet: Set<number> | null,
  writeSet: Set<number> | null,
  timeout: number,
): number => {
  const readFdSet = toFdSet(readSet);
  const writeFdSet = toFdSet(writeSet);
  const result = enet_socketset_select(
    maxSocket,
    readFdSet,
    writeFdSet,
    timeout,
  );

  fromFdSet(readFdSet, readSet);
  fromFdSet(writeFdSet, writeSet);

  return result;
};

export { posixSocketSet, select, windowsSocketSet };
