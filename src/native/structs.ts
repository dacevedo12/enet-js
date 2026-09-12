/* eslint-disable sort-keys */
import koffi from "koffi";

const enetUint8 = koffi.types.uint8;
const enetUint16 = koffi.types.uint16;
const enetUint32 = koffi.types.uint32;

const enetAddress = koffi.struct("ENetAddress", {
  host: enetUint32,
  port: enetUint16,
});

const enetPacket = koffi.struct("ENetPacket", {
  referenceCount: koffi.types.size_t,
  flags: enetUint32,
  data: "uint8 *",
  dataLength: koffi.types.size_t,
  freeCallback: "void *",
  userData: "void *",
});

const enetListNode = koffi.struct("ENetListNode", {
  next: "ENetListNode *",
  previous: "ENetListNode *",
});

const enetList = koffi.struct("ENetList", {
  sentinel: enetListNode,
});

const enetChannel = koffi.struct("ENetChannel", {
  outgoingReliableSequenceNumber: enetUint16,
  outgoingUnreliableSequenceNumber: enetUint16,
  usedReliableWindows: enetUint16,
  reliableWindows: koffi.array(enetUint16, 16),
  incomingReliableSequenceNumber: enetUint16,
  incomingUnreliableSequenceNumber: enetUint16,
  incomingReliableCommands: enetList,
  incomingUnreliableCommands: enetList,
});

const enetHost = koffi.opaque("ENetHost");

const enetPeer = koffi.struct("ENetPeer", {
  dispatchList: enetListNode,
  host: "ENetHost *",
  outgoingPeerID: enetUint16,
  incomingPeerID: enetUint16,
  connectID: enetUint32,
  outgoingSessionID: enetUint8,
  incomingSessionID: enetUint8,
  address: enetAddress,
  data: "void *",
  state: koffi.types.int,
  channels: "ENetChannel *",
  channelCount: koffi.types.size_t,
  incomingBandwidth: enetUint32,
  outgoingBandwidth: enetUint32,
  incomingBandwidthThrottleEpoch: enetUint32,
  outgoingBandwidthThrottleEpoch: enetUint32,
  incomingDataTotal: enetUint32,
  outgoingDataTotal: enetUint32,
  lastSendTime: enetUint32,
  lastReceiveTime: enetUint32,
  nextTimeout: enetUint32,
  earliestTimeout: enetUint32,
  packetLossEpoch: enetUint32,
  packetsSent: enetUint32,
  packetsLost: enetUint32,
  packetLoss: enetUint32,
  packetLossVariance: enetUint32,
  packetThrottle: enetUint32,
  packetThrottleLimit: enetUint32,
  packetThrottleCounter: enetUint32,
  packetThrottleEpoch: enetUint32,
  packetThrottleAcceleration: enetUint32,
  packetThrottleDeceleration: enetUint32,
  packetThrottleInterval: enetUint32,
  pingInterval: enetUint32,
  timeoutLimit: enetUint32,
  timeoutMinimum: enetUint32,
  timeoutMaximum: enetUint32,
  lastRoundTripTime: enetUint32,
  lowestRoundTripTime: enetUint32,
  lastRoundTripTimeVariance: enetUint32,
  highestRoundTripTimeVariance: enetUint32,
  roundTripTime: enetUint32,
  roundTripTimeVariance: enetUint32,
  mtu: enetUint32,
  windowSize: enetUint32,
  reliableDataInTransit: enetUint32,
  outgoingReliableSequenceNumber: enetUint16,
  acknowledgements: enetList,
  sentReliableCommands: enetList,
  outgoingSendReliableCommands: enetList,
  outgoingCommands: enetList,
  dispatchedCommands: enetList,
  flags: enetUint16,
  reserved: enetUint16,
  incomingUnsequencedGroup: enetUint16,
  outgoingUnsequencedGroup: enetUint16,
  unsequencedWindow: koffi.array(enetUint32, 32),
  eventData: enetUint32,
  totalWaitingData: koffi.types.size_t,
});

const enetEvent = koffi.struct("ENetEvent", {
  type: koffi.types.int,
  peer: "ENetPeer *",
  channelID: enetUint8,
  data: enetUint32,
  packet: "ENetPacket *",
});

export {
  enetAddress,
  enetChannel,
  enetEvent,
  enetHost,
  enetList,
  enetListNode,
  enetPacket,
  enetPeer,
  enetUint16,
  enetUint32,
  enetUint8,
};
