import ffi from "ffi-napi";
import arrayType from "ref-array-napi";
import ref from "ref-napi";
import structType from "ref-struct-napi";

const enetUint8 = ref.types.uchar;
const enetUint16 = ref.types.ushort;
const enetUint32 = ref.types.uint;

const enetAddress = structType([
  [enetUint32, "host"],
  [enetUint16, "port"],
]);

const enetPacket = structType([
  [ref.types.size_t, "referenceCount"],
  [enetUint32, "flags"],
  [ref.refType(enetUint8), "data"],
  [ref.types.size_t, "dataLength"],
  [ffi.Function(ref.types.void, []), "freeCallback"],
]);

const enetListNode = structType();
enetListNode.defineProperty("next", ref.refType(enetListNode));
enetListNode.defineProperty("previous", ref.refType(enetListNode));

const enetList = structType([[enetListNode, "sentinel"]]);

const enetChannel = structType([
  [enetUint16, "outgoingReliableSequenceNumber"],
  [enetUint16, "outgoingUnreliableSequenceNumber"],
  [enetUint16, "usedReliableWindows"],
  [enetUint16, "reliableWindows"],
  [enetUint16, "incomingReliableSequenceNumber"],
  [enetList, "incomingReliableCommands"],
  [enetList, "incomingUnreliableCommands"],
]);

const enetPeerState = ref.types.int;

const enetPeer = structType([
  [enetListNode, "dispatchList"],
  [ref.refType(ref.types.Object), "host"],
  [enetUint16, "outgoingPeerID"],
  [enetUint16, "incomingPeerID"],
  [enetUint32, "sessionID"],
  [enetAddress, "address"],
  [ref.refType(ref.types.void), "data"],
  [enetPeerState, "state"],
  [ref.refType(enetChannel), "channels"],
  [ref.types.size_t, "channelCount"],
  [enetUint32, "incomingBandwidth"],
  [enetUint32, "outgoingBandwidth"],
  [enetUint32, "incomingBandwidthThrottleEpoch"],
  [enetUint32, "outgoingBandwidthThrottleEpoch"],
  [enetUint32, "incomingDataTotal"],
  [enetUint32, "outgoingDataTotal"],
  [enetUint32, "lastSendTime"],
  [enetUint32, "lastReceiveTime"],
  [enetUint32, "nextTimeout"],
  [enetUint32, "earliestTimeout"],
  [enetUint32, "packetLossEpoch"],
  [enetUint32, "packetsSent"],
  [enetUint32, "packetsLost"],
  [enetUint32, "packetLoss"],
  [enetUint32, "packetLossVariance"],
  [enetUint32, "packetThrottle"],
  [enetUint32, "packetThrottleLimit"],
  [enetUint32, "packetThrottleCounter"],
  [enetUint32, "packetThrottleEpoch"],
  [enetUint32, "packetThrottleAcceleration"],
  [enetUint32, "packetThrottleDeceleration"],
  [enetUint32, "packetThrottleInterval"],
  [enetUint32, "lastRoundTripTime"],
  [enetUint32, "lowestRoundTripTime"],
  [enetUint32, "lastRoundTripTimeVariance"],
  [enetUint32, "highestRoundTripTimeVariance"],
  [enetUint32, "roundTripTime"],
  [enetUint32, "roundTripTimeVariance"],
  [enetUint16, "mtu"],
  [enetUint32, "windowSize"],
  [enetUint32, "reliableDataInTransit"],
  [enetUint16, "outgoingReliableSequenceNumber"],
  [enetList, "acknowledgements"],
  [enetList, "sentReliableCommands"],
  [enetList, "sentUnreliableCommands"],
  [enetList, "outgoingReliableCommands"],
  [enetList, "outgoingUnreliableCommands"],
  [enetList, "dispatchedCommands"],
  [ref.types.int, "needsDispatch"],
  [enetUint16, "incomingUnsequencedGroup"],
  [enetUint16, "outgoingUnsequencedGroup"],
  [enetUint32, "unsequencedWindow"],
  [enetUint32, "disconnectData"],
]);

const enetHost = structType([
  [ref.types.Object, "socket"],
  [enetAddress, "address"],
  [enetUint32, "incomingBandwidth"],
  [enetUint32, "outgoingBandwidth"],
  [enetUint32, "bandwidthThrottleEpoch"],
  [enetUint32, "mtu"],
  [ref.types.int, "recalculateBandwidthLimits"],
  [arrayType(enetPeer), "peers"],
  [ref.types.size_t, "peerCount"],
  [ref.types.size_t, "channelLimit"],
  [enetUint32, "serviceTime"],
  [ref.types.Object, "dispatchQueue"],
  [ref.types.int, "continueSending"],
  [ref.types.size_t, "packetSize"],
  [enetUint16, "headerFlags"],
  [ref.types.Object, "commands"],
  [ref.types.size_t, "commandCount"],
  [ref.types.Object, "buffers"],
  [ref.types.size_t, "bufferCount"],
  ["pointer", "checksum"],
  [enetAddress, "receivedAddress"],
  [enetUint8, "receivedData"],
  [ref.types.size_t, "receivedDataLength"],
  [enetUint32, "totalSentData"],
  [enetUint32, "totalSentPackets"],
  [enetUint32, "totalReceivedData"],
  [enetUint32, "totalReceivedPackets"],
]);

const enetEventType = ref.types.int;

const enetEvent = structType([
  [enetEventType, "type"],
  [ref.refType(enetPeer), "peer"],
  [enetUint8, "channelID"],
  [enetUint32, "data"],
  [ref.refType(enetPacket), "packet"],
]);

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
