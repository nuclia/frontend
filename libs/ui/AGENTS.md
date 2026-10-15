# AGENTS.md — `libs/ui` (`@nuclia/ui` and `@nuclia/ui-spartan/*`)

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

- `src/lib/spartan-components/accordion/` — accordion primitives; exported from `@nuclia/ui-spartan/accordion`.
- `src/lib/spartan-components/avatar/` — avatar, fallback, image, badge, and group primitives; exported from `@nuclia/ui-spartan/avatar`.
- `src/lib/spartan-components/button/` — button primitive and tokens; exported from `@nuclia/ui-spartan/button`.
- `src/lib/spartan-components/utils/` — class merging and Spartan provider helpers; exported from `@nuclia/ui-spartan/utils`.
- `theme/` — Tailwind, theme, and font styles.
- `docs/` — Storybook foundations pages for colors and typography.
- `.storybook/` — Angular Storybook configuration, theme switcher, and story ordering (`Foundations`, then `Spartan`).

`components.json` configures Spartan generation as an entrypoint under `@nuclia/ui-spartan`. Import components from their explicit subpath aliases; neither `@nuclia/ui` nor the Spartan root entrypoint exports the primitives.
