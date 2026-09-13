const ENetEventType = {
  connect: 1,
  disconnect: 2,
  none: 0,
  receive: 3,
} as const;

type ENetEventType = (typeof ENetEventType)[keyof typeof ENetEventType];

const ENetPacketFlag = {
  noAllocate: 4,
  none: 0,
  reliable: 1,
  sent: 256,
  unreliableFragment: 8,
  unsequenced: 2,
} as const;

type ENetPacketFlag = (typeof ENetPacketFlag)[keyof typeof ENetPacketFlag];

const ENetPeerState = {
  acknowledgingConnect: 2,
  acknowledgingDisconnect: 8,
  connected: 5,
  connecting: 1,
  connectionPending: 3,
  connectionSucceeded: 4,
  disconnectLater: 6,
  disconnected: 0,
  disconnecting: 7,
  zombie: 9,
} as const;

type ENetPeerState = (typeof ENetPeerState)[keyof typeof ENetPeerState];

const ENetSocketOption = {
  broadcast: 2,
  error: 8,
  nodelay: 9,
  nonblock: 1,
  rcvbuf: 3,
  rcvtimeo: 6,
  reuseaddr: 5,
  sndbuf: 4,
  sndtimeo: 7,
  ttl: 10,
} as const;

type ENetSocketOption =
  (typeof ENetSocketOption)[keyof typeof ENetSocketOption];

const ENetSocketShutdown = {
  read: 0,
  readWrite: 2,
  write: 1,
} as const;

type ENetSocketShutdown =
  (typeof ENetSocketShutdown)[keyof typeof ENetSocketShutdown];

const ENetSocketType = {
  datagram: 2,
  stream: 1,
} as const;

type ENetSocketType = (typeof ENetSocketType)[keyof typeof ENetSocketType];

const ENetSocketWait = {
  interrupt: 4,
  none: 0,
  receive: 2,
  send: 1,
} as const;

type ENetSocketWait = (typeof ENetSocketWait)[keyof typeof ENetSocketWait];

export {
  ENetEventType,
  ENetPacketFlag,
  ENetPeerState,
  ENetSocketOption,
  ENetSocketShutdown,
  ENetSocketType,
  ENetSocketWait,
};
