import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";

export default defineConfig([
  // JS/TS base config
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,tsx,jsx}"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 2018,
        sourceType: "module",
        project: "./tsconfig.json",
      },
      globals: globals.browser,
    },
    plugins: {
      js,
      "@typescript-eslint": tseslint.plugin,
      "@nx": require("@nx/eslint-plugin"),
    },
    rules: {
      // General rules
      "@typescript-eslint/explicit-member-accessibility": "off",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/no-parameter-properties": "off",
      "@typescript-eslint/no-extra-semi": "error",
      "no-extra-semi": "off",
      "@nx/enforce-module-boundaries": [
        "error",
        {
          enforceBuildableLibDependency: true,
          allow: [],
          depConstraints: [
            {
              sourceTag: "*",
              onlyDependOnLibsWithTags: ["*"],
            },
          ],
        },
      ],
    },
    // Extends recommended configs
    extends: [
      "js/recommended",
      ...tseslint.configs.recommended,
      "plugin:@nx/typescript",
      "plugin:@nx/javascript",
      "prettier",
    ],
  },
  // Override for TSX files
  {
    files: ["*.tsx"],
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
]);
