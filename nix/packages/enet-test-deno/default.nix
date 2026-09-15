{ pkgs }:
pkgs.writeShellApplication {
  name = "enet-test-deno";
  runtimeInputs = [
    pkgs.deno
    pkgs.nodejs_24
    pkgs.stdenv.cc
  ];
  text = ''
    export ENET_INCLUDE_PATH="${pkgs.enet}/include"
    export ENET_LIB_PATH="${pkgs.enet}/lib/libenet${pkgs.stdenv.hostPlatform.extensions.sharedLibrary}"
    npm ci
    # Koffi's prebuilt Linux module needs libstdc++, which Nix's Deno doesn't load
    export LD_LIBRARY_PATH="${pkgs.lib.makeLibraryPath [ pkgs.stdenv.cc.cc.lib ]}"
    deno --version
    deno run --allow-all ./node_modules/vitest/vitest.mjs run --coverage.enabled=false
  '';
}
