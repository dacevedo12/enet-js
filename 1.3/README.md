# enet-js

Modern Node.js bindings for [ENet](http://enet.bespin.org/), the reliable UDP
networking library.

This package uses N-API to provide a foreign function interface for the
native C library

Note that some ENet functions have not been covered yet, so feel free to
contribute the ones you need

## Docs

This package aims to serve only as a compatibility layer without expanding the
functionality, which means the functions and data structures mirror the
native ones, whose docs can be found at <http://enet.bespin.org/>.

This package also provides [TypeScript](https://www.typescriptlang.org/) type
definitions to help ensure proper usage.
