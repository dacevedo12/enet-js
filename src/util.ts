const IPV4_OCTETS = 4;
const START_OFFSET = 0;
const LITTLE_ENDIAN = true;

const ipToLong = (ip: string): number => {
  const view = new DataView(new ArrayBuffer(IPV4_OCTETS));

  for (const [index, octet] of ip.split(".").entries()) {
    view.setUint8(index, Number(octet));
  }

  return view.getUint32(START_OFFSET, LITTLE_ENDIAN);
};

const ipFromLong = (ipLong: number): string => {
  const view = new DataView(new ArrayBuffer(IPV4_OCTETS));

  view.setUint32(START_OFFSET, ipLong, LITTLE_ENDIAN);

  return new Uint8Array(view.buffer).join(".");
};

const nonNull = <Value>(value: Value | null, message: string): Value => {
  if (value === null) {
    throw new Error(message);
  }

  return value;
};

export { ipFromLong, ipToLong, nonNull };
