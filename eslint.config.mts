import { defineConfig } from "eslint/config";
import eslint from "@eslint/js";
import prettier from "eslint-config-prettier";
import importPlugin from "eslint-plugin-import";
import prettierPlugin from "eslint-plugin-prettier";
import tseslint from "typescript-eslint";

export default defineConfig([
  {
    ignores: ["coverage/**", "dist/**"],
  },
  {
    files: ["src/**/*.ts"],
    extends: [
      eslint.configs.all,
      ...tseslint.configs.all,
      prettier,
    ],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      import: importPlugin,
      prettier: prettierPlugin,
    },
    rules: {
      // TypeScript rules
      "@typescript-eslint/max-params": "off",
      "@typescript-eslint/no-magic-numbers": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-unsafe-type-assertion": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/prefer-readonly-parameter-types": "off",

      // General rules
      "max-params": "off",
      "new-cap": "off",
      "no-bitwise": "off",
      "no-ternary": "off",
      "no-undefined": "off",
      "one-var": ["error", "never"],
      "sort-imports": ["error", { ignoreDeclarationSort: true }],
      camelcase: ["error", { allow: ["enet_*"], ignoreImports: true }],

      // Import rules
      "import/exports-last": "error",
      "import/extensions": ["error", "always", { ignorePackages: true }],
      "import/first": "error",
      "import/newline-after-import": "error",
      "import/no-absolute-path": "error",
      "import/no-cycle": "error",
      "import/no-default-export": "error",
      "import/no-duplicates": "error",
      "import/no-extraneous-dependencies": "error",
      "import/no-mutable-exports": "error",
      "import/no-named-as-default-member": "error",
      "import/no-named-as-default": "error",
      "import/no-named-default": "error",
      "import/no-relative-parent-imports": "error",
      "import/no-self-import": "error",
      "import/no-unused-modules": "error",
      "import/no-useless-path-segments": "error",
      "import/order": [
        "error",
        {
          alphabetize: { order: "asc", caseInsensitive: true },
          groups: ["builtin", "external", "sibling"],
          "newlines-between": "always",
        },
      ],

      "prettier/prettier": "error",
    },
  },
  {
    files: ["src/**/*.test.ts"],
    rules: {
      // General rules
      "id-length": "off",
      "max-lines-per-function": "off",
      "max-statements": "off",
      "no-plusplus": "off",

    },
  },
]);
