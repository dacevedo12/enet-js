import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterAll, describe, expect, it } from "vitest";

import * as structs from "./native/structs.js";

interface FieldLayout {
  offset: number;
  size: number;
}

interface StructLayout {
  fields: Record<string, FieldLayout>;
  size: number;
}

type NativeType = (typeof structs)[keyof typeof structs];

const enetIncludePath = process.env.ENET_INCLUDE_PATH;

if (enetIncludePath === undefined) {
  throw Error(
    "ENET_INCLUDE_PATH is not set; set it to the directory containing enet/enet.h",
  );
}

const workDirectory = mkdtempSync(join(tmpdir(), "enet-js-layout-"));

const koffiLayout = (type: NativeType): StructLayout => {
  const { members = {}, size } = type;

  return {
    fields: Object.fromEntries(
      Object.values(members).map(({ name, offset, type: memberType }) => [
        name,
        { offset, size: memberType.size },
      ]),
    ),
    size,
  };
};

const layoutProgram = (struct: string, fields: string[]): string =>
  [
    "#include <stddef.h>",
    "#include <stdio.h>",
    "#include <enet/enet.h>",
    "int main(void) {",
    `  printf("size %zu\\n", sizeof(${struct}));`,
    ...fields.map(
      (field) =>
        `  printf("${field} %zu %zu\\n", offsetof(${struct}, ${field}), sizeof(((${struct} *) 0)->${field}));`,
    ),
    "  return 0;",
    "}",
  ].join("\n");

const cLayout = (struct: string, fields: string[]): StructLayout => {
  const source = join(workDirectory, `${struct}.c`);
  const binary = join(workDirectory, struct);

  writeFileSync(source, layoutProgram(struct, fields));
  execFileSync(
    process.env.CC ?? "cc",
    ["-I", enetIncludePath, "-o", binary, source],
    { stdio: "pipe" },
  );

  const [sizeLine = "", ...fieldLines] = execFileSync(binary, {
    encoding: "utf8",
  })
    .trim()
    .split("\n");

  return {
    fields: Object.fromEntries(
      fieldLines.map((line) => {
        const [name = "", offset = "", size = ""] = line.split(" ");

        return [name, { offset: Number(offset), size: Number(size) }];
      }),
    ),
    size: Number(sizeLine.split(" ")[1]),
  };
};

describe("native layout", () => {
  const records = Object.values(structs)
    .filter((type) => type.primitive === "Record")
    .map((type): [string, NativeType] => [type.name, type]);

  afterAll(() => {
    rmSync(workDirectory, { force: true, recursive: true });
  });

  it.each(records)("%s matches the C layout", (name, type) => {
    const declared = koffiLayout(type);

    expect(declared).toEqual(cLayout(name, Object.keys(declared.fields)));
  });
});
