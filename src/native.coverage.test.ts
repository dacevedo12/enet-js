import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

import * as native from "./native/index.js";

const ENET_API_PATTERN = /ENET_API\s[\w\s*]*?\b(?<name>enet_\w+)\s*\(/gu;

const enetIncludePath = process.env["ENET_INCLUDE_PATH"];

if (enetIncludePath === undefined) {
  throw new Error(
    "ENET_INCLUDE_PATH is not set; set it to the directory containing enet/enet.h",
  );
}

// ENet functions that are not bound yet, remove each one once it is bound
const unbound: ReadonlySet<string> = new Set([
  "enet_address_get_host",
  "enet_address_get_host_ip",
  "enet_address_set_host",
  "enet_host_bandwidth_limit",
  "enet_host_channel_limit",
  "enet_host_check_events",
  "enet_initialize_with_callbacks",
  "enet_packet_resize",
  "enet_peer_disconnect_later",
  "enet_peer_disconnect_now",
  "enet_peer_ping",
  "enet_peer_receive",
  "enet_peer_throttle_configure",
  "enet_socket_accept",
  "enet_socket_bind",
  "enet_socket_connect",
  "enet_socket_create",
  "enet_socket_destroy",
  "enet_socket_listen",
  "enet_socket_receive",
  "enet_socket_send",
  "enet_socket_set_option",
  "enet_socket_wait",
  "enet_socketset_select",
  "enet_time_get",
  "enet_time_set",
]);

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

const findCoverage = async (): Promise<Coverage> => {
  const headers = await readHeaders();
  const declared = new Set<string>();

  for (const match of headers.matchAll(ENET_API_PATTERN)) {
    const name = match.groups?.["name"];

    if (name !== undefined) {
      declared.add(name);
    }
  }

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
    const { unlisted } = await findCoverage();

    expect(unlisted).toStrictEqual([]);
  });

  it("binds only functions that the headers declare", async () => {
    const { undeclared } = await findCoverage();

    expect(undeclared).toStrictEqual([]);
  });

  it("lists as unbound only declared functions that are not bound", async () => {
    const { stale } = await findCoverage();

    expect(stale).toStrictEqual([]);
  });
});
