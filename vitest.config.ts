import { defineConfig } from "vitest/config";

// oxlint-disable-next-line import/no-default-export -- vitest loads the configuration from the default export
export default defineConfig({
  test: {
    coverage: {
      enabled: true,
      exclude: ["src/**/*.test.ts", "src/fixtures.ts"],
      include: ["src/**/*.ts"],
      provider: "v8",
      reporter: ["html", "text"],
    },
    include: ["src/**/*.test.ts"],
  },
});
