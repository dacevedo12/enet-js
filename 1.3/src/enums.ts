enum ENetEventType {
  none = 0,
  connect = 1,
  disconnect = 2,
  receive = 3,
}

enum ENetPacketFlag {
  none = 0,
  reliable = 1,
  unsequenced = 2,
  noAllocate = 4,
}

export { ENetEventType, ENetPacketFlag };
