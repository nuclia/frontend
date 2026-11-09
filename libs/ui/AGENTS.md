# AGENTS.md — `libs/ui` (`@nuclia/ui` and `@nuclia/ui-spartan/*`)

Angular library of Spartan/Helm UI primitives and Tailwind utilities. Nx project: `ui`.

## Run Commands

```bash
nx test ui        # @angular/build:unit-test (own test-build target); smoke spec: HlmBadge
nx lint ui
nx run ui:storybook
nx run ui:build-storybook
nx run ui:static-storybook
```

## Structure

- `src/lib/spartan-components/<name>/` — one folder per Spartan primitive (≈65, e.g. accordion, button, dialog, select, sidebar, sonner, table, tabs, tooltip, typography), each with `src/index.ts` (exports a `Hlm<Name>Imports` array), `src/lib/hlm-*.ts` and a `hlm-<name>.stories.ts`; exported from `@nuclia/ui-spartan/<name>` (one `tsconfig.base.json` path per folder). Folders `bubble`, `message`, `message-scroller`, `marker`, `attachment`, `questionnaire` are chat/form composites built from the same primitives.
- `src/lib/components/stepper/` (`@nuclia/ui/stepper`, story `PDP-UI/Stepper`) — Spartan **block** (not a CLI primitive), copied from `spartan-ng/spartan` `apps/app/src/app/pages/(blocks)/blocks/stepper/lib`; exported from `@nuclia/ui/stepper`. Renamed from the upstream `spartan-*` to the temporary `ui-` prefix (`ui-stepper`, `ui-step`, `uiStepperNext/Previous`, `UiStepperImports`); it will move to another prefix later. `next()` is patched to only touch `AbstractControl` step controls (the CDK `StepControl` type also allows signal-forms `Field`). `indicatorMode` has an added `completion` value (upstream only has `number | state | icon`): `state` checks every reached step, `completion` checks only completed steps that are not selected. To add another block, copy its `lib/` folder and rewrite `@spartan-ng/helm/*` imports to `@nuclia/ui-spartan/*`.
- `src/lib/components/<name>/` — our own design-system components built on Spartan (selector prefix `ui-`, class prefix `Ui`, files `ui-*.ts`), each with `src/index.ts` (exports a `Ui<Name>Imports` array) and a `ui-<name>.stories.ts` (story title `PDP-UI/<Name>`). Exported from `@nuclia/ui/<name>` (one `tsconfig.base.json` path per folder). Currently: `infinite-scroll` (`<ui-infinite-scroll (reachAnchor)>`, an `IntersectionObserver` anchor placed after a list; no virtualization), `toast` (`UiToastService` over sonner `toast.*`; the app renders one `<hlm-toaster />`), `option-with-description` (`<ui-option-with-description [label] [description]>`, two-line option content for `hlm-select-item` / `hlm-autocomplete-item`; both lines ellipsized, tooltip only when truncated) and `confirm-dialog` (`UiConfirmService.confirm(data): Observable<boolean>`, Spartan `alertdialog`).
- `src/lib/spartan-components/utils/` — class merging and Spartan provider helpers; exported from `@nuclia/ui-spartan/utils`.
- `theme/` — `tailwind.css` (Tailwind layers + Spartan preset) and `theme.css`, which imports `theme-spartan.css` (Spartan/shadcn CSS variables), `theme-tailwind.css` (Tailwind-side variables) and `fonts.css`. Keep Spartan and Tailwind variables in their own file. Only Storybook (`.storybook/storybook-styles.css`) imports these; no app stylesheet, `project.json` `styles` entry or TS file does (apps only register `@tailwindcss/postcss` in their `.postcssrc.json`), so Spartan/Tailwind classes only render in an app once it imports `libs/ui/theme/*.css`.
- `docs/` — Storybook foundations pages for colors and typography.
- `.storybook/` — Angular Storybook configuration, theme switcher, and story ordering (`Foundations`, `Spartan`, then `PDP-UI`).

Before adding or composing Spartan components, read `.github/skills/spartan/SKILL.md`. Add components with `npx nx g @spartan-ng/cli:ui <name>` (one name per run); the generator reformats `tsconfig.base.json`, so run prettier on it afterwards.

## Storybook stories (required for every Spartan component or block)

Whenever a component or block is added to `libs/ui` (or one an app imports from `@nuclia/ui-spartan/*` has none), add a story file in the same change. The Spartan CLI skill does not cover this. Copy the structure of `accordion/src/lib/hlm-accordion.stories.ts`, or `button/src/lib/hlm-button.stories.ts` for single-directive components.

- **Location:** next to the component, as `src/lib/spartan-components/<name>/src/lib/hlm-<name>.stories.ts` (own `ui-` components use `ui-<name>.stories.ts`, e.g. `ui-stepper.stories.ts`). Storybook picks up `libs/ui/**/*.stories.ts` automatically.
- **Meta:** `title: 'Spartan/<Name>'` (this keeps it under the `Spartan` group), `tags: ['autodocs']`, `component: <main class>`, and `decorators: [moduleMetadata({ imports: [...HlmXImports] })]` using the `HlmXImports` array exported from `'../index'`.
- **Docs:** `parameters.docs.description.component` says to import `HlmXImports` from `@nuclia/ui-spartan/<name>` (use the real alias) and how to compose the parts.
- **Controls:** `args` and `argTypes` (with `description` and a `control`) for the main inputs.
- **Stories:** `Default` plus one story per variant or state that matters (`Disabled`, `Invalid`, sizes, variants, `Open`…). Use `parameters: { controls: { disable: true } }` for stories without args.
- **Render:** `render: (args) => ({ props: args, template: '<html…>' })` (a template string). Templates may only use directives and components that are in the story's `imports`.
- **Icons:** register them with `provideIcons` in the story's `moduleMetadata`, as in the Spartan icons rule.
- **Other components:** import them in a story through relative paths (e.g. `'../../../label/src/index'`); the `@nuclia/ui-spartan/*` aliases trip the `@nx/enforce-module-boundaries` rule inside `libs/ui`.
- **Check:** `yarn prettier --write <story>`, `yarn eslint <story>` (`yarn nx lint ui` currently fails on its own config before linting anything), then `yarn nx run ui:build-storybook` (templates only fail at runtime, so also open the story with `yarn nx run ui:storybook`, port 4400).

`components.json` configures Spartan generation as an entrypoint under `@nuclia/ui-spartan`. Import components from their explicit subpath aliases; neither `@nuclia/ui` nor the Spartan root entrypoint exports the primitives.
