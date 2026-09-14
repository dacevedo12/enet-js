import type {
  ENetPacketFreeCallback,
  IENetAddress,
  IENetEvent,
  IENetHost,
  IENetPacket,
  IENetPeer,
} from "./index.js";
import { ENetEventType, ENetPacketFlag, enet } from "./index.js";
import { nonNull } from "./util.js";

interface Connection {
  readonly client: IENetHost;
  readonly peer: IENetPeer;
  readonly server: IENetHost;
}

const ANY_BANDWIDTH = 0;
const ANY_CHANNEL_COUNT = 0;
const ATTEMPT_STEP = 1;
const CHANNEL = 0;
const CLIENT_PEER_COUNT = 1;
const CONNECT_CHANNEL_COUNT = 1;
const CONNECT_DATA = 0;
const FIRST_ATTEMPT = 0;
const FIRST_PEER = 0;
const LOCALHOST = "127.0.0.1";
const SERVER_PEER_COUNT = 32;
const SERVICE_ATTEMPTS = 100;
const SERVICE_TIMEOUT_MS = 5;
const SETTLE_ROUNDS = 5;
const ACKNOWLEDGED_MESSAGE = "acknowledged";
const NEXT_MESSAGE = "next";

const localAddress = (port: number): IENetAddress => ({
  host: LOCALHOST,
  port,
});

const createServerOrNull = (address: IENetAddress): IENetHost | null =>
  enet.host.create(
    address,
    SERVER_PEER_COUNT,
    ANY_CHANNEL_COUNT,
    ANY_BANDWIDTH,
    ANY_BANDWIDTH,
  );

const createServer = (address: IENetAddress): IENetHost =>
  nonNull(
    createServerOrNull(address),
    `Unable to bind a server to port ${String(address.port)}`,
  );

const createClient = (): IENetHost =>
  nonNull(
    enet.host.create(
      null,
      CLIENT_PEER_COUNT,
      ANY_CHANNEL_COUNT,
      ANY_BANDWIDTH,
      ANY_BANDWIDTH,
    ),
    "Unable to create a client host",
  );

const connectOrNull = (
  client: IENetHost,
  address: IENetAddress,
): IENetPeer | null =>
  enet.host.connect(client, address, CONNECT_CHANNEL_COUNT, CONNECT_DATA);

const connectPeer = (client: IENetHost, address: IENetAddress): IENetPeer =>
  nonNull(connectOrNull(client, address), "No peer slot is available");

const createPacket = (
  data: Buffer,
  flags: number = ENetPacketFlag.reliable,
): IENetPacket =>
  nonNull(enet.packet.create(data, flags), "Unable to create a packet");

const serviceUntil = (
  target: IENetHost,
  other: IENetHost,
  type: ENetEventType,
): IENetEvent => {
  for (
    let attempt = FIRST_ATTEMPT;
    attempt < SERVICE_ATTEMPTS;
    attempt += ATTEMPT_STEP
  ) {
    enet.host.service(other, SERVICE_TIMEOUT_MS);

    const event = enet.host.service(target, SERVICE_TIMEOUT_MS);

    if (event.type === type) {
      return event;
    }
  }

  throw new Error(
    `No event of type ${String(type)} after ${String(SERVICE_ATTEMPTS)} attempts`,
  );
};

const receivePacket = (target: IENetHost, other: IENetHost): IENetPacket => {
  const event = serviceUntil(target, other, ENetEventType.receive);

  if (event.type !== ENetEventType.receive) {
    throw new Error("Expected a receive event");
  }

  return event.packet;
};

// Services both hosts a few times, so nothing from the handshake is left to send
const settle = (hosts: readonly IENetHost[]): void => {
  for (
    let attempt = FIRST_ATTEMPT;
    attempt < SETTLE_ROUNDS;
    attempt += ATTEMPT_STEP
  ) {
    for (const host of hosts) {
      enet.host.service(host, SERVICE_TIMEOUT_MS);
    }
  }
};

// Leaves the server's socket holding an acknowledgement for a packet with the given free callback and a new packet, so one service call runs the callback and takes a RECEIVE from ENet
const queueAcknowledgementAndPacket = (
  { client, peer, server }: Connection,
  onFree: ENetPacketFreeCallback,
): void => {
  const serverPeer = nonNull(
    server.peers[FIRST_PEER],
    "Expected a server peer",
  );
  const acknowledged = createPacket(Buffer.from(ACKNOWLEDGED_MESSAGE));

  settle([client, server]);
  acknowledged.freeCallback = onFree;
  enet.peer.send(serverPeer, CHANNEL, acknowledged);
  enet.host.flush(server);
  enet.packet.destroy(receivePacket(client, server));
  enet.peer.send(peer, CHANNEL, createPacket(Buffer.from(NEXT_MESSAGE)));
  enet.host.flush(client);
};

const withEnet = (run: () => void): void => {
  enet.initialize();

  try {
    run();
  } finally {
    enet.deinitialize();
  }
};

const withHosts = (hosts: readonly IENetHost[], run: () => void): void => {
  try {
    run();
  } finally {
    for (const host of hosts) {
      enet.host.destroy(host);
    }
  }
};

const withConnection = (
  address: IENetAddress,
  run: (connection: Connection) => void,
): void => {
  withEnet(() => {
    const server = createServer(address);
    const client = createClient();

    withHosts([client, server], () => {
      const peer = connectPeer(client, address);

      serviceUntil(server, client, ENetEventType.connect);
      run({ client, peer, server });
    });
  });
};

export type { Connection };
export {
  ACKNOWLEDGED_MESSAGE,
  CHANNEL,
  NEXT_MESSAGE,
  SERVICE_TIMEOUT_MS,
  connectOrNull,
  connectPeer,
  createClient,
  createPacket,
  createServer,
  createServerOrNull,
  localAddress,
  queueAcknowledgementAndPacket,
  receivePacket,
  serviceUntil,
  withConnection,
  withEnet,
  withHosts,
};
