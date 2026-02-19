{ pkgs, self' }:
{
  default = pkgs.mkShell {
    packages = pkgs.lib.flatten [
      (pkgs.lib.attrValues self'.packages)
    ];
  };
}
