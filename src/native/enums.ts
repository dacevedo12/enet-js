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

export { ENetEventType, ENetPacketFlag };
