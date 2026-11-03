# AGENTS.md — Nuclia Frontend Monorepo

Nx monorepo for all Nuclia/Progress frontend applications and shared libraries.  
Package manager: **yarn**. Node version managed via `.nvmrc`.

---

## Workspace Structure

```
apps/           # Deployable applications (Angular, React, Svelte)
libs/           # Shared libraries consumed via path aliases
tools/          # Build scripts (build-widgets.sh, build-sdk-docs.sh)
```

### Apps

| Project              | Stack           | Purpose                                                                                                                  |
| -------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `auth`               | Angular 22      | Dedicated auth app — login, signup, magic link, SSO, OAuth                                                               |
| `dashboard`          | Angular 22      | Primary ARAG platform UI (KBs, agents, usage)                                                                            |
| `rao`                | Angular 22      | RAO white-label (agents only, no KB management)                                                                          |
| `admin`              | Angular 22      | Account-management app (billing, members, API keys, `/at/:account/**`) — reused by `rao` and future white-label surfaces |
| `manager-v2`         | Angular 22      | Internal back-office (accounts, users, zones)                                                                            |
| `search-widget-demo` | Svelte 5 + Vite | Local dev sandbox for `libs/search-widget`                                                                               |
| `sistema-demo`       | Angular 22      | Interactive showcase for `libs/sistema`                                                                                  |

### Libraries

| Path alias                           | Nx name             | Stack      | Role                                                                                             |
| ------------------------------------ | ------------------- | ---------- | ------------------------------------------------------------------------------------------------ |
| `@nuclia/core`                       | `sdk-core`          | TypeScript | Nuclia JS/TS SDK — all REST/WS API calls                                                         |
| `@flaps/core`                        | `core`              | Angular    | App bootstrap, SDK wrapper, guards, auth, feature flags, analytics                               |
| `@flaps/common`                      | `common`            | Angular    | Shared feature modules used by dashboard, rao + admin                                            |
| `@nuclia/ui`, `@nuclia/ui-spartan/*` | `ui`                | Angular    | Spartan/Helm primitives and Tailwind utilities (see `libs/ui/AGENTS.md` for entrypoints)         |
| `@nuclia/sistema`                    | `sistema`           | Angular    | Nuclia design system (prefix `nsi-`)                                                             |
| `@nuclia/user`                       | `user`              | Angular    | Auth/identity flows for `apps/auth` (mixed selector prefixes; onboarding now in `@flaps/common`) |
| `@nuclia/sync`                       | `sync`              | Angular    | Data source sync UI (prefix `nsy-`)                                                              |
| `@nuclia/widget`                     | `search-widget`     | Svelte 5   | Embeddable search/chat web components                                                            |
| `@guillotinaweb/pastanaga-angular`   | `pastanaga-angular` | Angular    | Base component library (prefix `pa-`)                                                            |
| `@nuclia/chrome-ext`                 | `chrome-ext`        | Plain JS   | Chrome extension (no Angular/React)                                                              |

All aliases are declared in `tsconfig.base.json`. Internal consumers **never** import built artifacts — they compile directly against source via these aliases.

---

## Running Projects

```bash
# Angular apps
nx serve auth
nx serve dashboard
nx serve rao
nx serve admin
nx serve manager-v2
nx serve sistema-demo

# Vite apps
nx serve search-widget-demo  # Svelte, port 5173

# Libs / tools
nx build sdk-core          # Rollup → dist/sdk-core/ (ESM + UMD)
nx build chrome-ext        # Copies static files → dist/libs/chrome-ext/
nx build search-widget     # tools/build-widgets.sh (3 Vite passes)
nx test ui
nx lint ui
nx run ui:storybook
```

---

## Testing

| Project type                                                                                                                           | Runner                                                    |
| -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Angular projects: `admin`, `auth`, `dashboard`, `manager-v2`, `rao`, `sistema-demo`, `common`, `core`, `sistema`, `sync`, `ui`, `user` | Vitest 5 via `@angular/build:unit-test` (jsdom, zoneless) |
| `sdk-core`, `chrome-ext`                                                                                                               | Plain Vitest 5, `@nx/vitest`-inferred `test` target       |
| `search-widget`, `search-widget-demo`                                                                                                  | Vitest 5 (`nx:run-commands`)                              |

All run with `nx test <name>`. Test files are co-located alongside source as `*.spec.ts`. Jest is gone from all
first-party projects; only the external `libs/pastanaga-angular` still uses it.
`libs/common` and `libs/core` have **no `lint` target** — linting runs as part of the app build.

- **Run all:** `yarn test` (`nx run-many --all --target=test`). The root `vitest.config.ts` only aggregates the
  plain-Vitest projects; it can't run the Angular suites, so don't call `vitest` directly for those.
- **Watch / coverage:** Angular targets default to `watch: false`; use `nx test <name> --watch` or
  `--configuration=watch`. Coverage: `nx test <name> --configuration=ci` → `coverage/{apps,libs}/<name>`.
- **Single file:** `nx test <name> --include='**/foo.spec.ts'` (Angular builder; glob relative to the project source root).
- **SDK type checking:** `sdk-core:test` runs `sdk-core:test-typecheck` before Vitest; plain Vitest only transpiles TypeScript.
- **Libs own a `test-build` target** (`@angular/build:application`, compiler options only, no production build), and
  `test.buildTarget` is `<lib>:test-build` for `common`, `core`, `sistema`, `sync`, `ui`, `user`. Sistema Sass resolves
  through a direct `stylePreprocessorOptions.includePaths` of `libs/sistema/styles`, with no dependency on any app.
  `polyfills: []` is on purpose — a file-path polyfill makes Angular load `zone.js`.
- **Shared setup:** `test/translate-test-provider.ts` is the `providersFile` that stubs `TranslateService`;
  jsdom shims (`ResizeObserver`, `matchMedia`) live in `setupFiles` (`libs/common`, `apps/manager-v2` only).
  `.env.test` pins `BROWSERSLIST` to the last 2 Chrome versions so app browserslists don't break the builder.
- **Every Angular project must have at least one spec.** `@angular/build:unit-test` fails with "No tests found" on an
  empty project and has no `passWithNoTests` option. A new Angular project needs a `<app>:build:unit-test` build
  configuration (`polyfills: []`, `styles: []`, `assets: []`), an official `test` target and a `vitest-base.config.mts`
  (coverage dir only), plus a first real spec; never list it in the root `vitest.config.ts` or the `@nx/vitest` `include`.
- Details and examples: `.github/skills/testing-patterns/SKILL.md`.

---

## Key Conventions

### Angular components

- **Change detection:** zoneless (`provideZonelessChangeDetection()`) — no `zone.js` in any of
  the 6 first-party apps (`auth`, `dashboard`, `rao`, `admin`, `manager-v2`, `sistema-demo`; the last has no explicit provider and no `zone.js` polyfill).
  `OnPush` is still required everywhere, but CD is now purely
  signal/`markForCheck()`/`ApplicationRef.tick()`-driven — never assume a native event listener,
  `setTimeout`, or unpatched async callback will trigger a re-render on its own.
- **Selector prefixes:** declared in each lib's `project.json` (`nsi-`, `nus-`, `nsy-`, `stf-`, `nma-`).
- **Components:** standalone by default (no `standalone` flag); first-party components are never declared in an NgModule — the few `*.module.ts` files are import/route wrappers. Templates import `TranslatePipe` (apps provide `provideTranslateService()` in `main.ts`).
- **State files:** `*.state.ts` = Angular signal store. Older services use RxJS `BehaviorSubject`.
- **Testing:** every first-party test setup is zoneless (Vitest 5, `@angular/build:unit-test`).
  `waitForAsync()` and `fakeAsync()`/`tick()` **do not work** without `zone.js` — use
  `async`/`await` for async `beforeEach`/`compileComponents()`, and `vi.useFakeTimers()` /
  `vi.advanceTimersByTime()` / `await vi.runAllTimersAsync()` for tests that need to control timers.
  `libs/pastanaga-angular` is external and untouched: it keeps Jest, `zone.js` and `setup-env/zone`.

### Code comments

- **Write as few comments as possible.** Only comment code that genuinely needs clarification —
  a non-obvious workaround, a security/business-rule constraint, or a "why" that isn't clear from
  the code itself. Never restate what the code already says.
- Don't comment routine or self-explanatory code (getters, straightforward conditionals, obvious
  navigation/assignment). If a reviewer wouldn't ask "why is this here?", skip the comment.

### SCSS / Design tokens

- Import Sistema tokens in app global styles: `@use '@nuclia/sistema/styles/overrides'`.
- Override brand colours via CSS custom properties: `--custom-color-primary-regular`.
- Never fork SCSS token files — override only via `--custom-*` hooks.

### i18n

- Translation files live in `src/assets/i18n/` of each app/lib as `{locale}.json`.
- Bridge: `@guillotinaweb/pastanaga-angular` translation service + `@ngx-translate/core`.
- Supported locales: `en`, `es`, `fr`, `ca`.

### Module boundaries

- `@nx/enforce-module-boundaries` ESLint rule is active. Apps must not import from each other.
- Lazy-loaded feature routes occasionally use direct relative paths (`../../../../libs/…`) to avoid circular deps — this is suppressed with eslint-disable comments and is intentional.

### Environment / config

- Runtime config is fetched at bootstrap from `assets/deployment/app-config.json` (not baked into the bundle).
- Secret keys are injected via `VITE_*` environment variables (Vite apps) or `environment.ts` (Angular apps). Never commit API keys.

---

## Project-Level Documentation

Every app and lib has its own `AGENTS.md` with project-specific routing, components, services, and gotchas. Read the relevant file before working in any sub-project. This root file documents only what is shared across the entire workspace.

Projects may also have a `KNOWLEDGE.md` for deeper write-ups of non-obvious patterns, workarounds, and architectural decisions discovered during development sessions. If it exists, it will be linked from the project's `AGENTS.md`.

### AI workflow configuration

See `.github/copilot-instructions.md` for the full AI workflow: communication rules, anti-cycling protocol, task sizing, session knowledge capture, skill routing, and agent delegation.

<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

## General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax

<!-- nx configuration end-->
