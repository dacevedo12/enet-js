{ pkgs }:
pkgs.writeShellApplication {
  name = "enet-test";
  runtimeInputs = [
    pkgs.nodejs_24
    pkgs.stdenv.cc
  ];
  text = ''
    export ENET_INCLUDE_PATH="${pkgs.enet}/include"
    export ENET_LIB_PATH="${pkgs.enet}/lib/libenet${pkgs.stdenv.hostPlatform.extensions.sharedLibrary}"
    npm install
    npm test
  '';
}
