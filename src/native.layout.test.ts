import { execFile } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";

import { describe, expect, it } from "vitest";

import * as structs from "./native/structs.js";

interface FieldLayout {
  readonly offset: number;
  readonly size: number;
}

interface StructLayout {
  readonly fields: Readonly<Record<string, FieldLayout>>;
  readonly size: number;
}

// eslint-disable-next-line @typescript-eslint/strict-void-return -- util.promisify(execFile) is Node's documented promise API for execFile
const execFileAsync = promisify(execFile);

const enetIncludePath = process.env.ENET_INCLUDE_PATH;

if (enetIncludePath === undefined) {
  throw new Error(
    "ENET_INCLUDE_PATH is not set; set it to the directory containing enet/enet.h",
  );
}

const layoutProgram = (struct: string, fields: readonly string[]): string =>
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

const parseLayout = (output: string): StructLayout => {
  const [sizeLine = "", ...fieldLines] = output.trim().split("\n");
  const [, size = ""] = sizeLine.split(" ");
  const fields: Record<string, FieldLayout> = {};

  for (const line of fieldLines) {
    const [name = "", offset = "", fieldSize = ""] = line.split(" ");

    fields[name] = { offset: Number(offset), size: Number(fieldSize) };
  }

  return { fields, size: Number(size) };
};

const cLayout = async (
  struct: string,
  fields: readonly string[],
): Promise<StructLayout> => {
  const workDirectory = await mkdtemp(path.join(tmpdir(), "enet-js-layout-"));

  try {
    const source = path.join(workDirectory, `${struct}.c`);
    const binary = path.join(workDirectory, struct);

    await writeFile(source, layoutProgram(struct, fields));
    await execFileAsync(process.env.CC ?? "cc", [
      "-I",
      enetIncludePath,
      "-o",
      binary,
      source,
    ]);

    const { stdout } = await execFileAsync(binary);

    return parseLayout(stdout);
  } finally {
    await rm(workDirectory, { force: true, recursive: true });
  }
};

const koffiLayouts = new Map<string, StructLayout>();

for (const type of Object.values(structs)) {
  if (typeof type === "object" && type.primitive === "Record") {
    const fields: Record<string, FieldLayout> = {};

    for (const member of Object.values(type.members ?? {})) {
      fields[member.name] = { offset: member.offset, size: member.type.size };
    }

    koffiLayouts.set(type.name, { fields, size: type.size });
  }
}

describe("native layout", () => {
  it.each([...koffiLayouts])(
    "%s matches the C layout",
    async (name, declared) => {
      expect(declared).toStrictEqual(
        await cLayout(name, Object.keys(declared.fields)),
      );
    },
  );
});
