{ pkgs }:
pkgs.writeShellApplication {
  name = "enet-publish";
  runtimeInputs = [
    pkgs.git
    pkgs.nodejs_24
  ];
  text = ''
    version="$(node --print 'require("./package.json").version')"
    line="''${version%.*}"

    if [ "$GITHUB_REF_NAME" != "v$version" ]; then
      echo "The tag $GITHUB_REF_NAME doesn't match version $version in package.json" >&2
      exit 1
    fi

    if ! git merge-base --is-ancestor HEAD "origin/$line"; then
      echo "The tag $GITHUB_REF_NAME isn't on the $line branch" >&2
      exit 1
    fi

    # The default branch's line is latest, and older lines keep a <major>.<minor>x tag
    if [ "$line" = "$DEFAULT_BRANCH" ]; then
      tag="latest"
    else
      tag="''${line}x"
    fi

    # Building only needs tsc, and install scripts would run where an npm token can be minted
    npm ci --ignore-scripts
    npm run build
    npm stage publish --tag "$tag"
  '';
}
