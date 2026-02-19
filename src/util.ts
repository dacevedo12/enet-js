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

export { ipFromLong, ipToLong };
