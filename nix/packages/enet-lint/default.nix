{ pkgs }:
pkgs.writeShellApplication {
  name = "enet-lint";
  runtimeInputs = [ pkgs.nodejs_24 ];
  text = ''
    npm ci
    npm run lint-code
    npm run lint-docs
  '';
}
