# AGENTS.md — `libs/ui` (`@nuclia/ui`)

Angular library of Spartan/Helm UI primitives and Tailwind utilities. Nx project: `ui`.

## Run Commands

```bash
nx test ui
nx lint ui
nx run ui:storybook
nx run ui:build-storybook
nx run ui:static-storybook
```

## Structure

- `src/lib/spartan-components/avatar/` — avatar, fallback, image, badge, and group primitives; exported from `@nuclia/ui/avatar`.
- `src/lib/spartan-components/button/` — button primitive and tokens; exported from `@nuclia/ui/button`.
- `src/lib/spartan-components/utils/` — class merging and Spartan provider helpers; exported from `@nuclia/ui/utils`.
- `theme/` — Tailwind, theme, and font styles.
- `.storybook/` — Angular Storybook configuration.

The root `src/index.ts` does not export the sub-libraries. Import from the explicit subpath aliases rather than `@nuclia/ui`.
