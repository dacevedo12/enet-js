/* eslint-disable sort-keys */
import koffi, { type TypeObject } from "koffi";

const enetUint8: TypeObject = koffi.types.uint8;
const enetUint16: TypeObject = koffi.types.uint16;
const enetUint32: TypeObject = koffi.types.uint32;

const enetAddress: TypeObject = koffi.struct("ENetAddress", {
  host: enetUint32,
  port: enetUint16,
});

const enetPacket: TypeObject = koffi.struct("ENetPacket", {
  referenceCount: koffi.types.size_t,
  flags: enetUint32,
  data: "uint8 *",
  dataLength: koffi.types.size_t,
  freeCallback: "void *",
});

const enetListNode: TypeObject = koffi.struct("ENetListNode", {
  next: "ENetListNode *",
  previous: "ENetListNode *",
});

const enetList: TypeObject = koffi.struct("ENetList", {
  sentinel: enetListNode,
});

const enetChannel: TypeObject = koffi.struct("ENetChannel", {
  outgoingReliableSequenceNumber: enetUint16,
  outgoingUnreliableSequenceNumber: enetUint16,
  usedReliableWindows: enetUint16,
  reliableWindows: koffi.array(enetUint16, 16),
  incomingReliableSequenceNumber: enetUint16,
  incomingUnreliableSequenceNumber: enetUint16,
  incomingReliableCommands: enetList,
  incomingUnreliableCommands: enetList,
});

const enetHost: TypeObject = koffi.opaque("ENetHost");

const enetPeer: TypeObject = koffi.struct("ENetPeer", {
  dispatchList: enetListNode,
  host: "ENetHost *",
  outgoingPeerID: enetUint16,
  incomingPeerID: enetUint16,
  sessionID: enetUint32,
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
  lastRoundTripTime: enetUint32,
  lowestRoundTripTime: enetUint32,
  lastRoundTripTimeVariance: enetUint32,
  highestRoundTripTimeVariance: enetUint32,
  roundTripTime: enetUint32,
  roundTripTimeVariance: enetUint32,
  mtu: enetUint16,
  windowSize: enetUint32,
  reliableDataInTransit: enetUint32,
  outgoingReliableSequenceNumber: enetUint16,
  acknowledgements: enetList,
  sentReliableCommands: enetList,
  sentUnreliableCommands: enetList,
  outgoingReliableCommands: enetList,
  outgoingUnreliableCommands: enetList,
  dispatchedCommands: enetList,
  needsDispatch: koffi.types.int,
  incomingUnsequencedGroup: enetUint16,
  outgoingUnsequencedGroup: enetUint16,
  unsequencedWindow: koffi.array(enetUint32, 32),
  disconnectData: enetUint32,
});

const enetEvent: TypeObject = koffi.struct("ENetEvent", {
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
