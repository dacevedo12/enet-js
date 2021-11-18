# enet-js

Modern Node.js bindings for [ENet](http://enet.bespin.org/), the reliable UDP
networking library.

This package uses N-API to provide a foreign function interface for the
native C library

Note that some ENet functions have not been covered yet, so feel free to
contribute the ones you need

## Versioning

[![npm (tag)](https://img.shields.io/npm/v/enet-js/1.2x)](
  https://www.npmjs.com/package/enet-js
)

The `<major>.<minor>` version matches the supported enet version

## Install

---
**NOTE**: Node.js 14+ is currently unsupported due to a N-API
[bug](https://github.com/node-ffi-napi/node-ffi-napi/issues/97)

---

```sh
npm install --save-exact enet-js
```

Then, add a field in your package.json indicating the path where the dynamic
library is located. If you have binaries for multiple platforms, omit the
extension

```json
{
  "enetLibPath": "path/to/enet(.dll|.dylib|.so)"
}
```

To get the dynamic library, compile enet following the instructions at
<http://enet.bespin.org/Installation.html>.

## Usage

### Initialization

<http://enet.bespin.org/Tutorial.html#Initialization>

```ts
import { enet } from "enet-js";

const start = (): void => {
  if (enet.initialize() === 0) {
    process.on("SIGINT", (): void => {
      enet.deinitialize();
      process.exit();
    });

    // ...
  } else {
    console.error("Unable to initialize ENet");
    process.exit(1);
  }
};

start();
```

### Creating an ENet server

<http://enet.bespin.org/Tutorial.html#CreateServer>

```ts
const address: IENetAddress = {
  // Bind the server to the default localhost.
  host: ENET_HOST_ANY,
  port: 2600
};
const host: IENetHost | null = enet.host.create(
  // the address to bind the server host to
  address,
  // allow up to 32 clients and/or outgoing connections
  32,
  // assume any amount of incoming bandwidth
  0,
  // assume any amount of outgoing bandwidth
  0
);

if (host === null) {
  console.error("Unable to create host");
  process.exit(1);
} else {
  console.log("Server running on port", address.port);

  // ...

  enet.host.destroy(host);
}
```

### Managing an ENet host

<http://enet.bespin.org/Tutorial.html#ManageHost>

```ts
while (true) {
  // Wait up to 1000 milliseconds for an event.
  const event: IENetEvent | null = enet.host.service(host, 1000);

  if (event) {
    switch (event.type) {
      case ENetEventType.none:
        break;

      case ENetEventType.connect:
        console.log(
          "Client connected",
          event.peer.address.host,
          event.peer.address.port
        );
        break;

      case ENetEventType.disconnect:
        console.log(
          "Client disconnected",
          event.peer.address.host,
          event.peer.address.port
        );
        break;

      case ENetEventType.receive:
        console.log(
          "Packet received from channel",
          event.channelID,
          event.packet
        );
        // Clean up the packet now that we're done using it.
        enet.packet.destroy(packet);
        break;
    }
  }
}
```

### Sending a packet to an ENet peer

<http://enet.bespin.org/Tutorial.html#SendingPacket>

```ts
// Create a reliable packet of size 7 containing "packet\0"
const packet: IENetPacket | null = enet.packet.create(
  Buffer.from("packet\0"),
  ENetPacketFlag.reliable
);

/** Send the packet to the peer over channel id 0.
 * One could also broadcast the packet
 * using enet.host.broadcast(host, 0, packet);
 */
enet.peer.send(peer, 0, packet);
```

## Docs

This package aims to serve only as a compatibility layer without expanding the
functionality, which means the functions and data structures mirror the
native ones, whose docs can be found at <http://enet.bespin.org/>.

This package also provides [TypeScript](https://www.typescriptlang.org/) type
definitions to help ensure proper usage.
