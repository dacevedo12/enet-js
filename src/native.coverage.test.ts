import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";

import { describe, expect, it } from "vitest";

import * as native from "./native/index.js";

const enetIncludePath =
  process.env.ENET_INCLUDE_PATH ??
  join(dirname(process.env.ENET_LIB_PATH ?? ""), "..", "include");

// ENet functions that are not bound yet, remove each one once it is bound
const unbound = new Set([
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

const declaredFunctions = (): Set<string> => {
  const headerDirectory = join(enetIncludePath, "enet");
  const headers = readdirSync(headerDirectory)
    .filter((file) => file.endsWith(".h"))
    .map((file) => readFileSync(join(headerDirectory, file), "utf8"))
    .join("\n");

  return new Set(
    Array.from(
      headers.matchAll(/ENET_API\s[\w\s*]*?\b(?<name>enet_\w+)\s*\(/gu),
      (match) => match.groups!.name,
    ),
  );
};

describe("native coverage", () => {
  const declared = declaredFunctions();
  const bound = new Set(
    Object.keys(native).filter((name) => name.startsWith("enet_")),
  );

  it("binds every declared function not listed as unbound", () => {
    expect(
      [...declared].filter((name) => !bound.has(name) && !unbound.has(name)),
    ).toEqual([]);
  });

  it("binds only functions that the headers declare", () => {
    expect([...bound].filter((name) => !declared.has(name))).toEqual([]);
  });

  it("lists as unbound only declared functions that are not bound", () => {
    expect(
      [...unbound].filter((name) => bound.has(name) || !declared.has(name)),
    ).toEqual([]);
  });
});
