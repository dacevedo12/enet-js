/* eslint no-bitwise: "off" */

const ipToLong = (ip: string): number =>
  // eslint-disable-next-line fp/no-mutating-methods
  ip
    .split(".")
    .reverse()
    .reduce(
      (previousValue, currentValue) =>
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        (previousValue << 8) + parseInt(currentValue, 10),
      0
    ) >>> 0;

const ipFromLong = (ipLong: number): string =>
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  [ipLong & 255, (ipLong >> 8) & 255, (ipLong >> 16) & 255, ipLong >>> 24].join(
    "."
  );

export { ipFromLong, ipToLong };
