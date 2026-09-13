import type { LibraryHandle } from "koffi";
import koffi from "koffi";

const enetLibPath = process.env["ENET_LIB_PATH"];

if (enetLibPath === undefined) {
  throw new Error(
    "ENET_LIB_PATH is not set; set it to the full path of the ENet shared library",
  );
}

const lib: LibraryHandle = koffi.load(enetLibPath);

// Prototypes name ENet's structs, so importing the library declares them first
export * from "./structs.js";
export { lib };
