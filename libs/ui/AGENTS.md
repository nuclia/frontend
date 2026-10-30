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
- `src/lib/spartan-components/{input,textarea,label,checkbox,badge,alert-dialog,toggle,toggle-group,tooltip}/` — form, badge, alert-dialog, toggle and tooltip primitives; each exported from `@nuclia/ui-spartan/<name>`.
- `src/lib/spartan-components/stepper/` — Spartan **block** (not a CLI primitive), copied from `spartan-ng/spartan` `apps/app/src/app/pages/(blocks)/blocks/stepper/lib`; exported from `@nuclia/ui-spartan/stepper`. Selectors keep the upstream `spartan-*` names (`spartan-stepper`, `spartan-step`, `spartanStepperNext/Previous`). `next()` is patched to only touch `AbstractControl` step controls (the CDK `StepControl` type also allows signal-forms `Field`). `indicatorMode` has an added `completion` value (upstream only has `number | state | icon`): `state` checks every reached step, `completion` checks only completed steps that are not selected. To add another block, copy its `lib/` folder and rewrite `@spartan-ng/helm/*` imports to `@nuclia/ui-spartan/*`.
- `src/lib/spartan-components/utils/` — class merging and Spartan provider helpers; exported from `@nuclia/ui-spartan/utils`.
- `theme/` — Tailwind, theme, and font styles.
- `docs/` — Storybook foundations pages for colors and typography.
- `.storybook/` — Angular Storybook configuration, theme switcher, and story ordering (`Foundations`, then `Spartan`).

Before adding or composing Spartan components, read `.github/skills/spartan/SKILL.md`. Add components with `npx nx g @spartan-ng/cli:ui <name>` (one name per run); the generator reformats `tsconfig.base.json`, so run prettier on it afterwards.

## Storybook stories (required for every Spartan component or block)

Whenever a component or block is added to `libs/ui` (or one an app imports from `@nuclia/ui-spartan/*` has none), add a story file in the same change. The Spartan CLI skill does not cover this. Copy the structure of `accordion/src/lib/hlm-accordion.stories.ts`, or `button/src/lib/hlm-button.stories.ts` for single-directive components.

- **Location:** next to the component, as `src/lib/spartan-components/<name>/src/lib/hlm-<name>.stories.ts` (blocks keep their upstream prefix, e.g. `spartan-stepper.stories.ts`). Storybook picks up `libs/ui/**/*.stories.ts` automatically.
- **Meta:** `title: 'Spartan/<Name>'` (this keeps it under the `Spartan` group), `tags: ['autodocs']`, `component: <main class>`, and `decorators: [moduleMetadata({ imports: [...HlmXImports] })]` using the `HlmXImports` array exported from `'../index'`.
- **Docs:** `parameters.docs.description.component` says to import `HlmXImports` from `@nuclia/ui-spartan/<name>` (use the real alias) and how to compose the parts.
- **Controls:** `args` and `argTypes` (with `description` and a `control`) for the main inputs.
- **Stories:** `Default` plus one story per variant or state that matters (`Disabled`, `Invalid`, sizes, variants, `Open`…). Use `parameters: { controls: { disable: true } }` for stories without args.
- **Render:** `render: (args) => ({ props: args, template: '<html…>' })` (a template string). Templates may only use directives and components that are in the story's `imports`.
- **Icons:** register them with `provideIcons` in the story's `moduleMetadata`, as in the Spartan icons rule.
- **Other components:** import them in a story through relative paths (e.g. `'../../../label/src/index'`); the `@nuclia/ui-spartan/*` aliases trip the `@nx/enforce-module-boundaries` rule inside `libs/ui`.
- **Check:** `yarn prettier --write <story>`, `yarn eslint <story>` (`yarn nx lint ui` currently fails on its own config before linting anything), then `yarn nx run ui:build-storybook` (templates only fail at runtime, so also open the story with `yarn nx run ui:storybook`, port 4400).

`components.json` configures Spartan generation as an entrypoint under `@nuclia/ui-spartan`. Import components from their explicit subpath aliases; neither `@nuclia/ui` nor the Spartan root entrypoint exports the primitives.
