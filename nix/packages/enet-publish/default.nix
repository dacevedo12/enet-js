{ pkgs }:
pkgs.writeShellApplication {
  name = "publish";
  runtimeInputs = [
    pkgs.git
    pkgs.nodejs_24
  ];
  text = ''
    npm install
    npm config set "//registry.npmjs.org/:_authToken" "''${NPM_TOKEN}"

    if git diff "''${CI_COMMIT_BEFORE_SHA}" package.json | grep -q '+  "version"'; then
      npm publish --provenance --tag 1.2x
    else
      echo "Version didn't change, skipping publish..."
    fi
  '';
}
