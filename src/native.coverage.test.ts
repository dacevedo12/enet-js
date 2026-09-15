import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it, vi } from "vitest";

// oxlint-disable-next-line import/no-namespace -- the test compares every export of the bindings module with enet.h
import * as native from "./native/index.js";

vi.setConfig({ testTimeout: 10_000 });

const ENET_API_PATTERN = /ENET_API\s[\w\s*]*?\b(?<name>enet_\w+)\s*\(/gu;
const EXTERN_PATTERN = /extern\s[\w\s*]*?\b(?<name>enet_\w+)\s*\(/gu;

// Functions a header declares extern rather than ENET_API, bound anyway because ENet documents them for users: the 1.2.2 ChangeLog says to set host->checksum to enet_crc32
const documentedExterns: ReadonlySet<string> = new Set(["enet_crc32"]);

const enetIncludePath = process.env["ENET_INCLUDE_PATH"];

if (enetIncludePath === undefined) {
  throw new Error(
    "ENET_INCLUDE_PATH is not set; set it to the directory containing enet/enet.h",
  );
}

// ENet functions that are not bound yet, remove each one once it is bound
const unbound: ReadonlySet<string> = new Set<string>();

const readHeaders = async (): Promise<string> => {
  const headerDirectory = path.join(enetIncludePath, "enet");
  const files = await readdir(headerDirectory);
  const headers = await Promise.all(
    files
      .filter((file) => file.endsWith(".h"))
      .map(async (file) => readFile(path.join(headerDirectory, file), "utf8")),
  );

  return headers.join("\n");
};

interface Coverage {
  readonly stale: readonly string[];
  readonly undeclared: readonly string[];
  readonly unlisted: readonly string[];
}

const declaredNames = (headers: string): ReadonlySet<string> => {
  const declared = new Set<string>();

  for (const match of headers.matchAll(ENET_API_PATTERN)) {
    declared.add(match.groups?.["name"] ?? "");
  }

  for (const match of headers.matchAll(EXTERN_PATTERN)) {
    const name = match.groups?.["name"] ?? "";

    if (documentedExterns.has(name)) {
      declared.add(name);
    }
  }

  return declared;
};

const findCoverage = async (): Promise<Coverage> => {
  const declared = declaredNames(await readHeaders());

  const bound = new Set(
    Object.keys(native).filter((name) => name.startsWith("enet_")),
  );

  return {
    stale: [...unbound].filter(
      (name) => bound.has(name) || !declared.has(name),
    ),
    undeclared: [...bound].filter((name) => !declared.has(name)),
    unlisted: [...declared].filter(
      (name) => !bound.has(name) && !unbound.has(name),
    ),
  };
};

describe("native coverage", () => {
  it("binds every declared function not listed as unbound", async () => {
    expect.hasAssertions();

    const { unlisted } = await findCoverage();

    expect(unlisted).toStrictEqual([]);
  });

  it("binds only functions that the headers declare", async () => {
    expect.hasAssertions();

    const { undeclared } = await findCoverage();

    expect(undeclared).toStrictEqual([]);
  });

  it("lists as unbound only declared functions that are not bound", async () => {
    expect.hasAssertions();

    const { stale } = await findCoverage();

    expect(stale).toStrictEqual([]);
  });
});
