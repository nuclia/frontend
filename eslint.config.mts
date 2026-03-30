import nxPlugin from "@nx/eslint-plugin";

export default [
  // Global ignores (node_modules is auto-ignored by ESLint 9)
  { ignores: ["dist/**"] },

  // Nx base — registers the @nx plugin, ignores .nx
  ...nxPlugin.configs["flat/base"],

  // Nx flat/typescript — bundles @eslint/js recommended, typescript-eslint
  // parser + recommended rules, Nx TypeScript rules, and eslint-config-prettier
  ...nxPlugin.configs["flat/typescript"],

  // Nx flat/javascript — bundles @eslint/js recommended for JS files,
  // Nx JavaScript rules, and eslint-config-prettier
  ...nxPlugin.configs["flat/javascript"],

  // Project-specific rules (applied after prettier so overrides stick)
  {
    files: ["**/*.{ts,tsx,mts,cts,js,mjs,cjs,jsx}"],
    rules: {
      "@typescript-eslint/explicit-member-accessibility": "off",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/no-parameter-properties": "off",
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
  },

  // TSX override
  {
    files: ["**/*.tsx"],
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
] as const;
