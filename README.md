# enet-js

Modern Node.js bindings for [ENet](http://enet.bespin.org/), the reliable UDP
networking library.

This package uses [Koffi](https://koffi.dev/) to provide a foreign function
interface for the native C library

Note that some ENet functions have not been covered yet, so feel free to
contribute the ones you need

## Versioning

[![npm (tag)](https://img.shields.io/npm/v/enet-js/latest)](https://www.npmjs.com/package/enet-js)

The `<major>.<minor>` version matches the supported enet version

## Install

```sh
npm install --save-exact enet-js
```

**Note:** This package requires Node.js 18 or later.

Before importing enet-js, set the `ENET_LIB_PATH` environment variable to the
full path of the ENet shared library (including extension, e.g. `.dll`,
`.dylib`, or `.so`).

```sh
export ENET_LIB_PATH="/path/to/libenet.0.dylib"
```

Or set it when running your application:

```sh
ENET_LIB_PATH=/path/to/libenet.0.dylib node your-app.js
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
  port: 1234,
};
const host: IENetHost | null = enet.host.create(
  // the address to bind the server host to
  address,
  // allow up to 32 clients and/or outgoing connections
  32,
  // assume any number of channels
  0,
  // assume any amount of incoming bandwidth
  0,
  // assume any amount of outgoing bandwidth
  0,
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

### Creating an ENet client

<http://enet.bespin.org/Tutorial.html#CreateClient>

```ts
const host: IENetHost | null = enet.host.create(
  // create a client host
  null,
  // only allow 1 outgoing connection
  1,
  // assume any number of channels
  0,
  // assume any amount of incoming bandwidth
  0,
  // assume any amount of outgoing bandwidth
  0,
);

if (host === null) {
  console.error("Unable to create host");
  process.exit(1);
} else {
  // ...

  enet.host.destroy(host);
}
```

### Managing an ENet host

<http://enet.bespin.org/Tutorial.html#ManageHost>

```ts
while (true) {
  // Wait up to 1000 milliseconds for an event.
  const event: IENetEvent = enet.host.service(host, 1000);

  switch (event.type) {
    case ENetEventType.none:
      break;

    case ENetEventType.connect:
      console.log(
        "Client connected",
        event.peer.address.host,
        event.peer.address.port,
      );
      break;

    case ENetEventType.disconnect:
      console.log(
        "Client disconnected",
        event.peer.address.host,
        event.peer.address.port,
      );
      break;

    case ENetEventType.receive:
      console.log(
        "Packet received from channel",
        event.channelID,
        event.packet.data,
      );
      // Clean up the packet now that we're done using it.
      enet.packet.destroy(event.packet);
      break;
  }
}
```

### Sending a packet to an ENet peer

<http://enet.bespin.org/Tutorial.html#SendingPacket>

```ts
// Create a reliable packet of size 7 containing "packet\0"
const packet: IENetPacket | null = enet.packet.create(
  Buffer.from("packet\0"),
  ENetPacketFlag.reliable,
);

/* Send the packet to the peer over channel id 0.
 * One could also broadcast the packet
 * using enet.host.broadcast(host, 0, packet);
 */
if (packet) {
  enet.peer.send(peer, 0, packet);
  // One could just use enet.host.service() instead.
  enet.host.flush(host);
}
```

### Disconnecting an ENet peer

<http://enet.bespin.org/Tutorial.html#Disconnecting>

```ts
enet.peer.disconnect(peer, 0);
/* Allow up to 3 seconds for the disconnect to succeed
 * and drop any received packets.
 */
const event: IENetEvent = enet.host.service(host, 3000);

switch (event.type) {
  case ENetEventType.disconnect:
    console.log("Disconnection succeeded.");
    return;

  case ENetEventType.receive:
    enet.packet.destroy(packet);
    break;
}
/* We've arrived here, so the disconnect attempt didn't
 * succeed yet. Force the connection down.
 */
enet.peer.reset(peer);
```

### Connecting to an ENet host

<http://enet.bespin.org/Tutorial.html#Connecting>

```ts
// Connect to 127.0.0.1:1234.
const address: IENetAddress = { host: "127.0.0.1", port: 1234 };

// Initiate the connection, allocating the two channels 0 and 1.
const peer: IENetPeer | null = enet.host.connect(host, address, 2, 0);

if (peer === null) {
  console.error("No available peers for initiating an ENet connection");
  process.exit(1);
}

// Wait up to 5 seconds for the connection attempt to succeed.
const event: IENetEvent = enet.host.service(host, 5000);

if (event.type === ENetEventType.connect) {
  console.log("Connection to 127.0.0.1:1234 succeeded.");

  // ...
} else {
  /* Either the 5 seconds are up or a disconnect event was
   * received. Reset the peer in the event the 5 seconds
   * had run out without any significant event.
   */
  enet.peer.reset(peer);
  console.error("Connection to 127.0.0.1:1234 failed.");
}
```

## Docs

This package aims to serve only as a compatibility layer without expanding the
functionality, which means the functions and data structures mirror the native
ones, whose docs can be found at <http://enet.bespin.org/>.

This package also provides [TypeScript](https://www.typescriptlang.org/) type
definitions to help ensure proper usage.
