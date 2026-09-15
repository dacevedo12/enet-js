{ pkgs }:
pkgs.writeShellApplication {
  name = "enet-test-bun";
  runtimeInputs = [
    pkgs.bun
    pkgs.nodejs_24
    pkgs.stdenv.cc
  ];
  text = ''
    export ENET_INCLUDE_PATH="${pkgs.enet}/include"
    export ENET_LIB_PATH="${pkgs.enet}/lib/libenet${pkgs.stdenv.hostPlatform.extensions.sharedLibrary}"
    npm ci
    # Koffi's prebuilt Linux module needs libstdc++, which Nix's Bun doesn't load
    export LD_LIBRARY_PATH="${pkgs.lib.makeLibraryPath [ pkgs.stdenv.cc.cc.lib ]}"
    bun --version
    bun --bun ./node_modules/.bin/vitest run --coverage.enabled=false
  '';
}
