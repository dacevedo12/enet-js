{
  description = "Node.js bindings for ENet, the reliable UDP networking library";

  inputs = {
    flake-parts.url = "github:hercules-ci/flake-parts/80daad04eddbbf5a4d883996a73f3f542fa437ac";
    nixpkgs.url = "github:nixos/nixpkgs/ab9fbbcf4858bd6d40ba2bbec37ceb4ab6e1f562";
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
          };

          devShells = import ./nix/shell { inherit pkgs self'; };
          packages = import ./nix/packages { inherit pkgs; };
        };
    };
}
