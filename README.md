## enet-js

Modern Node.js bindings for [ENet](http://enet.bespin.org/), the reliable UDP
networking library.

This package uses N-API to provide a foreign function interface for the
native C library

Note that some ENet methods have not been covered yet, so feel free to
contribute the ones you need

## Versioning

[![npm (tag)](https://img.shields.io/npm/v/enet-js/1.2x)](
  https://www.npmjs.com/package/enet-js
)

The branch name on the repo and release tag on npm match the supported major
enet version

## Install

---
**NOTE**: Node.js 14+ is currently not supported due to a N-API
[bug](https://github.com/node-ffi-napi/node-ffi-napi/issues/97)

---

```sh
$ npm install --save-exact enet-js
```

Then, add a field in your package.json indicating the path where the enet binary
is located

```json
{
  "enetLibPath": "path/to/enet(.dll|.so)"
}
```

## Usage

Here's an example of a basic server

```ts
import type { IENetAddress, IENetEvent, IENetHost } from "enet-js";
import { ENET_HOST_ANY, ENetEventType, enet } from "enet-js";

const main = (): void => {
  if (enet.initialize() !== 0) {
    console.error("Unable to initialize ENet");
  } else {
    const address: IENetAddress = {
      host: ENET_HOST_ANY,
      port: 2600,
    };
    const peerCount = 32;
    const host: IENetHost | null = enet.host.create(address, peerCount, 0, 0);

    if (host === null) {
      console.error("Unable to create host");
    } else {
      console.log("Server running in port", address.port);

      while (true) {
        const timeout = 0;
        const events: IENetEvent[] = enet.host.service(host, timeout);

        events.forEach((event: IENetEvent): void => {
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
              break;
          }
        });
      }
    }
  }
};

main();
```

## Docs

This package aims to serve only as a compatibility layer without extending any
functionality, which means most of the methods and data structures mirror the
official ones, whose docs can be found at http://enet.bespin.org/ and also,
the codebase uses [TypeScript](https://www.typescriptlang.org/) to help ensure
proper usage
