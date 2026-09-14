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
  nonblock: 1,
  rcvbuf: 3,
  reuseaddr: 5,
  sndbuf: 4,
} as const;

type ENetSocketOption =
  (typeof ENetSocketOption)[keyof typeof ENetSocketOption];

const ENetSocketType = {
  datagram: 2,
  stream: 1,
} as const;

type ENetSocketType = (typeof ENetSocketType)[keyof typeof ENetSocketType];

const ENetSocketWait = {
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
  ENetSocketType,
  ENetSocketWait,
};
