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

| Project              | Stack           | Purpose                                                        |
| -------------------- | --------------- | -------------------------------------------------------------- |
| `auth`               | Angular 21      | Dedicated auth app — login, signup, magic link, SSO, OAuth     |
| `dashboard`          | Angular 21      | Primary ARAG platform UI (KBs, agents, usage)                  |
| `rao`                | Angular 21      | RAO white-label (agents only, no KB management)                |
| `manager-v2`         | Angular 21      | Internal back-office (accounts, users, zones)                  |
| `nucliadb-admin`     | Angular 21      | Standalone NucliaDB admin (hash routing)                       |
| `search-widget-demo` | Svelte 5 + Vite | Local dev sandbox for `libs/search-widget`                     |
| `rao-demo`           | React 19 + Vite | Local dev sandbox for `libs/rao-widget`                        |
| `sistema-demo`       | Angular 21      | Interactive showcase for `libs/sistema`                        |

### Libraries

| Path alias                         | Nx name             | Stack      | Role                                                    |
| ---------------------------------- | ------------------- | ---------- | ------------------------------------------------------- |
| `@nuclia/core`                     | `sdk-core`          | TypeScript | Nuclia JS/TS SDK — all REST/WS API calls                |
| `@flaps/core`                      | `core`              | Angular    | App bootstrap, SDK wrapper, guards, auth, feature flags |
| `@flaps/common`                    | `common`            | Angular    | Shared feature modules used by dashboard + rao          |
| `@nuclia/sistema`                  | `sistema`           | Angular    | Nuclia design system (prefix `nsi-`)                    |
| `@nuclia/user`                     | `user`              | Angular    | Auth/identity/onboarding flows (prefix `nus-`)          |
| `@nuclia/sync`                     | `sync`              | Angular    | Data source sync UI (prefix `nsy-`)                     |
| `@nuclia/widget`                   | `search-widget`     | Svelte 5   | Embeddable search/chat web components                   |
| `rao-widget`                       | `rao-widget`        | React 19   | Embeddable ARAG chat web component                      |
| `@guillotinaweb/pastanaga-angular` | `pastanaga-angular` | Angular    | Base component library (prefix `pa-`)                   |
| `@nuclia/chrome-ext`               | `chrome-ext`        | Plain JS   | Chrome extension (no Angular/React)                     |

All aliases are declared in `tsconfig.base.json`. Internal consumers **never** import built artifacts — they compile directly against source via these aliases.

---

## Running Projects

```bash
# Angular apps
nx serve auth
nx serve dashboard
nx serve rao
nx serve manager-v2
nx serve nucliadb-admin
nx serve sistema-demo

# Vite apps
nx serve rao-demo          # React, port 4201
nx serve search-widget-demo  # Svelte, port 5173

# Libs / tools
nx build sdk-core          # Rollup → dist/sdk-core/ (ESM + UMD)
nx build chrome-ext        # Copies static files → dist/libs/chrome-ext/
nx build search-widget     # tools/build-widgets.sh (3 Vite passes)
```

---

## Testing

| Project type                          | Runner                          | Command pattern  |
| ------------------------------------- | ------------------------------- | ---------------- |
| Angular apps & libs                   | Jest 30 (`jest-preset-angular`) | `nx test <name>` |
| `search-widget`, `search-widget-demo` | Vitest 4                        | `nx test <name>` |
| `rao-widget`, `rao-demo`              | Vitest 4                        | `nx test <name>` |

Test files are co-located alongside source as `*.spec.ts`.  
`libs/common` and `libs/core` have **no `lint` target** — linting runs as part of the app build.

---

## Key Conventions

### Angular components

- **Change detection:** `OnPush` everywhere — enforced via `nx.json` generator defaults.
- **Selector prefixes:** declared in each lib's `project.json` (`nsi-`, `nus-`, `nsy-`, `stf-`, `nma-`).
- **New components:** standalone by default; NgModules kept only for legacy compatibility.
- **State files:** `*.state.ts` = Angular signal store. Older services use RxJS `BehaviorSubject`.

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

## Project-Level AGENTS.md Files

Every app and lib has its own `AGENTS.md` with project-specific routing, components, services, and gotchas. Read the relevant file before working in any sub-project. This root file documents only what is shared across the entire workspace.

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
