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

The package exports a single `enet` object that mirrors ENet's C API:
`enet_<group>_<name>` becomes `enet.<group>.<camelCaseName>`, and functions
without a group (`initialize`, `initializeWithCallbacks`, `deinitialize`,
`linkedVersion`, `crc32`) sit on `enet` itself.

- Groups and their modules: `address` (`address.ts`), `host` (`host.ts`, with
  fields in `host-handle.ts` and `compress*` in `compressor.ts`), `packet`
  (`packet.ts`), `peer` (`peer.ts`), `rangeCoder` (`range-coder.ts`), `socket`
  (`socket.ts`), `socketset` (`socketset.ts`) and `time` (`time.ts`)
- `constants.ts`, `enums.ts` and `macros.ts` export ENet's constants, enums and
  macros under their C names

### Native Bindings Layer (`src/native/`)

- `native/library.ts` - Loads ENet from `ENET_LIB_PATH`, and re-exports
  `structs.ts` so every struct is declared before a prototype names it
- `native/address.ts`, `global.ts`, `host.ts`, `packet.ts`, `peer.ts`,
  `range-coder.ts` and `socket.ts` - One binding per ENet function, declared
  with its C prototype and re-exported by `native/index.ts`
- `native/structs.ts` - Koffi struct declarations matching the C structs. The
  `ENetSocket` type, `ENetBuffer` field order and `ENetHost` layout follow the
  platform; the Windows layouts come from the headers and aren't tested in CI
- `native/callbacks.ts` - Koffi prototypes for ENet's callback types
- `native/enums.ts` - ENet enum values, re-exported by `src/enums.ts`
- `native/pointers.ts` - `NativePointer`, the per-struct pointer type, since
  Koffi 3 pointers are plain BigInts that Koffi doesn't type-check
- A new binding must be removed from the `unbound` list in
  `src/native.coverage.test.ts`

### Handles

Wrapper modules hand out handles: thin objects over ENet's structs that don't
expose pointers or Koffi.

- `createHandle` in `util.ts` stores the pointer under the `nativePointer` symbol
  from `structs.ts`, which the package doesn't export. Field getters live on a
  shared prototype and read ENet's memory with `koffi.decode` at
  `koffi.offsetof` offsets
- Only fields ENet documents are exposed, and only the ones it documents as
  writable get setters. JS-only fields (`peer.data`, `packet.userData`) are own
  properties created with the handle
- enet-js stays a thin layer over C by design: it doesn't validate handles or
  track lifetimes, and misuse fails as it would in C. Don't add such checks
- `peer.ts` keeps one peer object per peer pointer for each host, so peers
  compare like `ENetPeer *` in C
- `packet.data` is a `Buffer` over the packet's memory, like `packet->data`,
  so it moves when `enet.packet.resize` grows the packet
- IP addresses convert between strings and 32-bit integers in `util.ts`

### C to JavaScript

- Out-parameters become return values: the filled value, or `null` when the C
  status is negative (`outValue` in `util.ts`). Results that mean more than
  success come back in an object with the out-parameters
- `ENetBuffer` arrays are `Buffer[]` (`buffers.ts`). Socket sets are
  `Set<number>`, encoded as the platform's `fd_set` in `socketset.ts`
- ENet stores every callback it is given, so JS functions go through
  `koffi.register`, never as transient functions. Clear the C field before
  unregistering, since Koffi reuses freed slots, and share one registered
  callback per kind when ENet passes a key (host, packet, compressor context)
- Every JS function ENet calls runs inside `guardCallback` or
  `guardVoidCallback` (`callbacks.ts`). `guardCallback` also treats a result
  that isn't a number as an error, since ENet would otherwise get a stale value
- Every wrapper whose native call can run a JS callback or allocate wraps that
  call in `afterCallbacks`, which rethrows the first error a callback threw.
  `host.service` and `host.checkEvents` go through `dispatchEvent` in `host.ts`
  instead: when a callback threw, they keep the event ENet had taken for the
  host's next call, which `host.destroy` drops
- `Buffer`s passed to JS callbacks are views valid only during the callback, and
  a compressor object's `destroy` runs once for each host it was given to

### Type Definitions (`src/structs.ts`)

Defines the public handle, address, callback and event types. Event types use
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
- `tsc`, `oxlint` and `oxfmt` run at their strictest settings. Fix code rather
  than turning a rule off: the only exceptions are the documented ones in
  `.oxlintrc.json`, or a single line with
  `// oxlint-disable-next-line <rule> -- <reason>`
