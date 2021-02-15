/* eslint no-bitwise: "off" */

export interface StructBuffer extends Buffer {
  ref: () => Buffer;
}

export const ipToLong = (ip: string): number =>
  ip
    .split(".")
    .map(parseInt)
    .reduce(
      (previousValue: number, currentValue: number): number =>
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        (previousValue << 8) + currentValue
    ) >>> 0;

export const ipFromLong = (ipLong: number): string =>
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  [ipLong & 255, (ipLong >> 8) & 255, (ipLong >> 16) & 255, ipLong >>> 24].join(
    "."
  );
