{ pkgs }:
let
  enet = pkgs.enet.overrideAttrs (oldAttrs: {
    version = "1.2.5";
    src = pkgs.fetchurl {
      url = "http://enet.bespin.org/download/enet-1.2.5.tar.gz";
      sha256 = "sha256-13529yxEW1DP6Cd70QezJKAppL1TdBaFE6owLe7sMCs=";
    };
  });
in
pkgs.writeShellApplication {
  name = "enet-test";
  runtimeInputs = [ pkgs.nodejs_24 ];
  text = ''
    export ENET_LIB_PATH="${enet}/lib/libenet${pkgs.stdenv.hostPlatform.extensions.sharedLibrary}"
    npm install
    npm test
  '';
}
