{
  description = "Node.js bindings for ENet, the reliable UDP networking library";

  inputs = {
    flake-parts.url = "github:hercules-ci/flake-parts/31729ca8cbdb4fa927b34e5f4353e6a83f39e993";
    nixpkgs.url = "github:nixos/nixpkgs/eaad089433ca2bb662274377d33df3d0e51ef28b";
  };

  outputs =
    inputs:
    inputs.flake-parts.lib.mkFlake { inherit inputs; } {
      systems = [
        "aarch64-darwin"
        "aarch64-linux"
        "x86_64-darwin"
        "x86_64-linux"
      ];

      perSystem =
        {
          inputs',
          pkgs,
          self',
          system,
          ...
        }:
        let
          lib' = {
            environment = import ./nix/environment { inherit pkgs; };
          };
        in
        {
          _module.args.pkgs = import inputs.nixpkgs {
            inherit system;
            config.allowUnfree = true;
            overlays = [
              (final: prev: {
                enet = prev.enet.overrideAttrs {
                  version = "1.2.5";
                  src = final.fetchurl {
                    url = "http://enet.bespin.org/download/enet-1.2.5.tar.gz";
                    sha256 = "sha256-13529yxEW1DP6Cd70QezJKAppL1TdBaFE6owLe7sMCs=";
                  };
                };
              })
            ];
          };

          devShells = import ./nix/shell { inherit pkgs self'; };
          packages = import ./nix/packages { inherit pkgs; };
        };
    };
}
