# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

## Project Overview

enet-js provides Node.js bindings for [ENet](http://enet.bespin.org/), a
reliable UDP networking library. It uses [Koffi](https://koffi.dev/) for foreign
function interface (FFI) to call the native C library.

**Versioning:** The `<major>.<minor>` version matches the supported ENet
version.

## Build Commands

```bash
npm run build        # Compile TypeScript to dist/
npm run format       # Format src with oxfmt
npm run lint-code    # Type-check, lint and check formatting
npm run lint-docs    # Run markdownlint on markdown files
npm run test         # Run vitest tests with coverage
```

## Runtime Requirements

Before importing enet-js, the `ENET_LIB_PATH` environment variable must be set
to the full path of the ENet shared library (including extension like `.dll`,
`.dylib`, or `.so`):

```bash
ENET_LIB_PATH=/path/to/libenet.0.dylib node your-app.js
```

## Test Requirements

Besides `ENET_LIB_PATH`, tests need `ENET_INCLUDE_PATH` set to the directory
containing `enet/enet.h`, and a C compiler (`CC`, default `cc`):

- `src/native.layout.test.ts` compiles a small C program against `enet/enet.h`
  and compares `sizeof`/`offsetof` with the Koffi struct declarations
- `src/native.coverage.test.ts` checks the bound functions against the
  `ENET_API` functions declared in the headers

`nix run .#enet-test` sets both variables and provides the compiler.

Shared test helpers live in `src/fixtures.ts` (ENet hosts, peers and packets),
which is excluded from the build and coverage.

## Architecture

### Module Structure

The package exports a single `enet` object that mirrors the native ENet API
structure:

- `enet.initialize()` / `enet.deinitialize()` - Global lifecycle (from
  `global.ts`)
- `enet.host.*` - Host operations: create, destroy, connect, service, broadcast,
  flush (from `host.ts`)
- `enet.packet.*` - Packet operations: create, destroy (from `packet.ts`)
- `enet.peer.*` - Peer operations: send, disconnect, reset (from `peer.ts`)

### Native Bindings Layer (`src/native/`)

- `native/structs.ts` - Koffi struct definitions matching C ENet structures
  (ENetAddress, ENetPacket, ENetPeer, ENetEvent, etc.)
- `native/index.ts` - FFI function bindings using `koffi.load()` to call native
  ENet functions
- When binding a new ENet function, remove it from the `unbound` list in
  `src/native.coverage.test.ts`

### TypeScript Wrapper Layer

Each wrapper module (host.ts, packet.ts, peer.ts) converts between:

- **JS interface types** (`IENetHost`, `IENetPeer`, `IENetPacket`) - user-facing
  with string IPs and Buffer data
- **Native types** - Koffi pointers (BigInts) and numeric representations

Key conversions:

- IP addresses: string format ↔ 32-bit integer (via `util.ts`
  ipToLong/ipFromLong)
- Packet data: Buffer ↔ native pointer + length
- All native resources wrapped with a `native` property holding the pointer,
  typed per struct (`NativePointer<"ENetHost">` etc. in `structs.ts`) because
  Koffi 3 pointers are plain BigInts that Koffi doesn't type-check at runtime

### Type Definitions (`src/structs.ts`)

Defines TypeScript interfaces for all ENet structures. Event types use
discriminated unions based on `ENetEventType`:

- `IENetEventEmpty` (type: none)
- `IENetEventWithPacket` (type: receive)
- `IENetEventWithPeer` (type: connect | disconnect)

## Code Style

- ESM modules with `.js` extensions in imports (even for TypeScript files)
- No default exports (enforced by oxlint)
- Imports sorted by oxfmt (built-in, external, then relative); exports
  alphabetized
- Functional style preferred (const functions, no classes)
