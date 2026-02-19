{ pkgs }:
{
  enet-lint = import ./enet-lint { inherit pkgs; };
  enet-publish = import ./enet-publish { inherit pkgs; };
  enet-test = import ./enet-test { inherit pkgs; };
}
