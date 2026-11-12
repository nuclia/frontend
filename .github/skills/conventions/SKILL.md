---
name: conventions
description: >
  Source of truth for Angular code structure, state management, naming,
  TypeScript, component design and import conventions of this workspace.
  Reference skill for the Angular code writer and reviewer; load it when
  writing or reviewing Angular code. Where it conflicts with angular-developer
  (for example file naming), this skill wins.
user-invocable: false
---

# conventions

Our Angular conventions. Writers apply them; reviewers check against them.
Generic Angular guidance lives in `angular-developer`, UI components in
`spartan`. This skill only holds our decisions and overrides them.

They apply to all Angular code in this repo. Legacy code may not follow them
yet: apply them to new and touched code, and do not rewrite untouched code.

The structure rules (Code structure, Files of a component) do not apply to
`libs/ui/src/lib/spartan-components/`: it keeps the Spartan CLI layout.

## Code structure

We use a domain-driven structure to keep navigation clear and let features grow
independently.

- Each feature has its own `<feature>/` folder.
- It may contain components, each in its own `<component>/` folder.
- A feature's root component (the one named like the feature) lives directly in
  the `<feature>/` folder, never in a same-named subfolder
  (`confirm-dialog/confirm-dialog.component.ts`, not
  `confirm-dialog/confirm-dialog/confirm-dialog.component.ts`).
- Do not add `src/` or `lib/` folders inside a feature, and no `index.ts` that
  re-exports a single file: point the import path at the file instead.
- A component may have subcomponents, stored inside the `<feature>` folder to
  avoid deep nesting.
- 2-3 levels of nesting is fine, as long as each directory keeps a reasonable
  number of files/folders (up to 10-20).
- When several components share a folder, name them so their hierarchical
  relation to the parent/other components is clear.
- `<feature>` must be a name a developer understands at a glance.

### Files of a component

`<name>` is the component's folder name.

A component **must** have both files. Splitting `.ts` and `.html` is mandatory
for every component, including shared libraries (`libs/ui`, `libs/common`, ...)
and code copied from upstream (e.g. Spartan blocks): reference the template with
`templateUrl`.

| File                    | Holds                                                                                 |
| ----------------------- | ------------------------------------------------------------------------------------- |
| `<name>.component.ts`   | Definition and UI logic                                                               |
| `<name>.component.html` | Template. Inline only when it is a one-liner (e.g. `<router-outlet></router-outlet>`) |

The only exception is a one-line template (e.g. `<router-outlet></router-outlet>`)
or an empty one. Any multi-line template, however short, goes in the `.html` file.

A component **may** have:

| File                   | Holds                                                                                                                         |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `<name>.component.css` | Styles. The design system is Tailwind-based, so most components have no style file; when one is needed it is CSS.             |
| `<name>.service.ts`    | Business logic and state. Acts as a view model: provided as a `protected` service, used directly in the template, named `vm`. |
| `<name>.utils.ts`      | Magic numbers, config lists/objects, pure functions shared among the feature's components                                     |
| `<name>.model.ts`      | Interfaces and types                                                                                                          |

A feature split into several components may split its `vm` into several services
if needed (usually when a service is godlike and has 500+ lines of code).

### Split incrementally

Start with `<name>.component.{html|ts}` only. Split when needed, in this order:

1. `component.ts` grows too large (usually 80+ lines): first consider splitting
   the component itself (`.ts` + `.html`) into meaningful parts, which is also the
   way to solve DRY or structure problems. If it does not split meaningfully,
   move everything that is not purely UI from `component.ts` to
   `<name>.service.ts`.
2. `service.ts` grows (usually 80+ lines): move constants, config and pure
   functions to `<name>.utils.ts`, and interfaces and types to
   `<name>.model.ts`.

Do not create small files with a few lines of code without need, and do not
leave a file large when it should be split.

### Spec files

A feature has one spec file, `<feature>.spec.ts`, in the feature folder. It
covers the feature as a whole: the main component with its subcomponents, the
`vm` service and the utils, mostly through the main component. Cover only the
important behavior, not every detail.

Do not add a `.spec.ts` per component, service or utils file of the feature
(`<name>.component.spec.ts`, `<name>.service.spec.ts`, `<name>.utils.spec.ts`).
Shared components, services and utils that live outside a feature folder keep
their own `<name>.spec.ts`.

## Components

- Standalone components. Modules only when some components must be exported and
  used together, to make that easier.

## State management

- Use signals to store changeable state and do simple things in a simple way.
- Avoid observables by default. Use them only where they are needed: complex
  asynchronous flows, where they shine most.

## Naming

- Component selector prefixes indicate a component's origin. We keep only a few,
  because a prefix per app or library is excessive and components moved from
  apps to libs were not prefixed consistently:
  - `app-` — components inside the application
  - `lib-` — components inside a library
  - `hlm-` — original Spartan components
  - `ui-` — components built on Spartan components that belong to our design system
- Do not prefix interfaces. A suffix such as `Summary` or `Details` is fine when
  an object can be extended.
- Constants are `UPPER_SNAKE`.
- Prefer union-literal types over enums.

## TypeScript

- `any` is not allowed.
- Prefer `interface` over `type` (enforced by ESLint). Use `type` only for
  union-literal types.

## Comments

- No comments by default. Do not narrate what the code does, restate names or
  types, or add JSDoc that only repeats the signature.
- Comment only kludges and hacks (workarounds, browser/library quirks, surprising
  behavior), and keep each comment very short: one line explaining why.
- Prefer clearer code over a comment.

## Translations

- User-visible text goes through the translation files, never hardcoded.
- Add, edit or delete texts only in `en.json` (`assets/i18n/en.json` of the lib,
  or `public/i18n/en.json` for `search-widget`).
- Never touch the other locale files (`ca`, `es`, `fr`, ...): they are translated
  manually with BabelEdit.

## Imports

- Import order and grouping are automatic on save.
- Libraries use barrel imports, so imports stay compact outside the library.
- Inside a library, use relative paths to prevent circular dependencies.
- Relative imports are allowed only inside the same app/lib.
- Never import from another app. If something is needed from another app, move
  it to a lib first.
- Never import relatively from another lib. Use the lib barrel.

## Tests

- Isolated parts of the code are tested with unit tests run by Vitest.
- Unit tests are expected only where logic is not obvious: vm services with
  business logic, utils and pure functions with branching, app-wide code
  (resolvers, interceptors, guards), and regression tests for bug fixes. Do not
  add tests for obvious, simple code just because it exists.
- User flows are tested with Cypress e2e tests: a critical-path set that runs on
  changes to related branches, and a set with all other paths that runs during
  release.
