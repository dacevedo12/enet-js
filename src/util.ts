const ipToLong = (ip: string): number =>
  ip
    .split(".")
    .toReversed()
    .reduce(
      (previousValue, currentValue) =>
        (previousValue << 8) + parseInt(currentValue, 10),
      0,
    ) >>> 0;

const ipFromLong = (ipLong: number): string =>
  [ipLong & 255, (ipLong >> 8) & 255, (ipLong >> 16) & 255, ipLong >>> 24].join(
    ".",
  );

const nonNull = <Value>(value: Value | null, message: string): Value => {
  if (value === null) {
    throw new Error(message);
  }

  return value;
};

export { ipFromLong, ipToLong, nonNull };
