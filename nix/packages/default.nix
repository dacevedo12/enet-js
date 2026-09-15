{ pkgs }:
{
  enet-lint = import ./enet-lint { inherit pkgs; };
  enet-publish = import ./enet-publish { inherit pkgs; };
  enet-test = import ./enet-test { inherit pkgs; };
  enet-test-bun = import ./enet-test-bun { inherit pkgs; };
  enet-test-deno = import ./enet-test-deno { inherit pkgs; };
}
