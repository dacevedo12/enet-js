# Contributing

These are the house rules. They apply to every contributor, human or otherwise.

## Ways to contribute

Open an issue to report a bug, a part of ENet's API that enet-js gets wrong, or
a place where enet-js behaves differently from ENet. Open a pull request to fix
one. Both count, and an issue that names a problem precisely is worth more than
a guess at the fix.

Both go to [GitHub](https://github.com/dacevedo12/enet-js). The GitLab repository
only mirrors it.

## What enet-js is

A thin layer over ENet's C API. ENet's documentation describes enet-js, and the
README lists the few C patterns that are translated to JavaScript.

- Do not add functionality ENet doesn't have.
- Do not validate arguments or guard against misuse. A call that is invalid in
  C is invalid here too, and fails the way it would in C.
- Struct layouts and constants follow vanilla ENet. A build patched to change
  them is its consumer's responsibility.

## Release lines

Branch `1.3` binds ENet 1.3 and branch `1.2` binds ENet 1.2, and enet-js
versions share the major and minor of the ENet version they bind. A change that
applies to both lines needs a pull request against each. Files stay identical
between the lines unless the ENet versions force them apart.

Pull requests are merged by rebase, so history stays linear.

## Releases

A release bumps the version in a pull request. Once it merges, pushing the tag
`v<version>` on the merged commit stages the package on npm through trusted
publishing, with no token. It goes live when a maintainer approves it on
npmjs.com with 2FA, under `latest` for the default branch's line and
`<major>.<minor>x` for older lines.

## Dependencies

Runtime dependencies take a version range, so an application can share them
with its other dependencies. Development dependencies are pinned. Do not add a
tool for a job another tool already does.

## Checks

`nix run .#enet-lint`, `nix run .#enet-test`, `nix run .#enet-test-bun` and
`nix run .#enet-test-deno` run the same checks as CI, so a local pass is a
remote pass.

Without Nix, `npm run lint-code` and `npm run lint-docs` lint the code and the
documentation. `npm test` needs `ENET_LIB_PATH` set to the shared library of the
ENet version the branch binds, `ENET_INCLUDE_PATH` set to the directory
containing its `enet/enet.h`, and a C compiler (`CC`, default `cc`). The tests
check the struct layouts and the bound functions against ENet's headers.

Type checking, linting and formatting use the strictest configuration the tools
allow, and coverage stays at 100%. A lint error is fixed in the code, not by
turning the rule off. The few rules that are off say why in `.oxlintrc.json`.
