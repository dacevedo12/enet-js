{ pkgs }:
pkgs.writeShellApplication {
  name = "publish";
  runtimeInputs = [
    pkgs.git
    pkgs.nodejs_24
  ];
  text = ''
    npm install
    npm run build

    if git diff "''${CI_COMMIT_BEFORE_SHA}" package.json | grep -q '+  "version"'; then
      npm publish --tag 1.2x
    else
      echo "Version didn't change, skipping publish..."
    fi
  '';
}
