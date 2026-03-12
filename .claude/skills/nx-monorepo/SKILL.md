---
name: nx-monorepo
description: >
  Nx monorepo patterns as used in the Nuclia frontend workspace — covering module boundary
  enforcement, generator usage, project.json targets & executors, adding new apps/libs with
  correct tags, affected commands, and cache configuration. Activate this skill for ANY Nx
  task in this repo: running/debugging builds, adding a new library or app, wiring up a new
  target, debugging affected runs, understanding project graph dependencies, or fixing ESLint
  module-boundary violations. Do not wait for the user to say "Nx" explicitly — if the task
  touches project.json, nx.json, tsconfig.base.json paths, or the build/test/serve pipeline,
  this skill applies. Also use when a user asks which project name to pass to nx commands,
  or when they want to know which tags or constraints are in play.
---

# Nx Monorepo — Nuclia Frontend Workspace

This skill captures how Nx is **actually configured** in this repo. The workspace is an
Angular-primary Nx monorepo managed with **yarn**. Always match existing patterns; never
invent configuration that does not exist in this codebase.

---

## Quick Reference — Project Names

Use these exact names in `nx <target> <project>` commands.

| CLI name | Type | Stack | Path |
|---|---|---|---|
| `dashboard` | app | Angular 21 | `apps/dashboard/` |
| `rao` | app | Angular 21 | `apps/rao/` |
| `manager-v2` | app | Angular 21 | `apps/manager-v2/` |
| `nucliadb-admin` | app | Angular 21 | `apps/nucliadb-admin/` |
| `sistema-demo` | app | Angular 21 | `apps/sistema-demo/` |
| `search-widget-demo` | app | Svelte 5 + Vite | `apps/search-widget-demo/` |
| `rao-demo` | app | React 19 + Vite | `apps/rao-demo/` |
| `sdk-core` | lib | TypeScript | `libs/sdk-core/` |
| `core` | lib | Angular | `libs/core/` |
| `common` | lib | Angular | `libs/common/` |
| `sistema` | lib | Angular | `libs/sistema/` |
| `user` | lib | Angular | `libs/user/` |
| `sync` | lib | Angular | `libs/sync/` |
| `search-widget` | lib | Svelte 5 | `libs/search-widget/` |
| `rao-widget` | lib | React 19 | `libs/rao-widget/` |
| `pastanaga-angular` | lib | Angular | `libs/pastanaga-angular/` |
| `chrome-ext` | lib | Plain JS | `libs/chrome-ext/` |

> `common` and `core` have **no `lint` target** — linting runs as part of each app build.

---

## Running Targets

```bash
# Standard pattern
nx <target> <project-name>

# Examples
nx serve dashboard
nx build sdk-core
nx test common
nx lint sistema

# Pass config
nx build dashboard --configuration=production

# Run a target across all affected projects (see Affected section)
nx affected --target=test
```

---

## Module Boundaries

The `@nx/enforce-module-boundaries` ESLint rule is configured in `eslint.config.mts`.

### Current constraint setup

```ts
"@nx/enforce-module-boundaries": ["error", {
  enforceBuildableLibDependency: true,
  allow: [],
  depConstraints: [
    { sourceTag: "*", onlyDependOnLibsWithTags: ["*"] }
  ]
}]
```

The wildcard `*→*` means **no tag-based restrictions are actively enforced today** beyond
`enforceBuildableLibDependency: true`. However:

- **Apps must not import from each other** — this is a hard architectural rule (enforced by
  code review and the cross-project import check, not by specific tags yet).
- Lazy-loaded routes occasionally use relative paths across lib boundaries; these are
  intentionally suppressed with `// eslint-disable-next-line @nx/enforce-module-boundaries`.
  Do not remove those comments — they are load-order workarounds, not mistakes.

### Tags on projects

All current `project.json` files have `"tags": []`. When adding a new project, follow the
intended pattern but do not add tag constraints to `eslint.config.mts` unless the team has
agreed to enforce them — empty tags are the current norm.

### How to fix a boundary violation

1. Check whether the import is genuinely wrong (app→app cross-import) or a known exception.
2. If it's a genuine violation, move the shared code to the appropriate lib (e.g., `common`
   or `sdk-core`).
3. If it's an intentional exception (lazy-route workaround), add the disable comment.

For deeper detail → see `references/module-boundaries.md`.

---

## Generators

`nx.json` sets workspace-wide generator defaults. Always use `nx g` (not `ng g`) so Nx
defaults are applied.

### Component

```bash
# In an Angular app or lib:
nx g @nx/angular:component <name> --project=<project> --directory=<relative-path>

# Example — add a component to libs/common
nx g @nx/angular:component kb-list --project=common --directory=src/lib/kb
```

Generator defaults (from `nx.json`):
- `style: scss` — never css
- `changeDetection: OnPush` — baked in, don't override
- `type: component` — appended to filename (`*.component.ts`)

### Library

```bash
nx g @nx/angular:library <name> --directory=libs/<name> --importPath=@nuclia/<name>
```

- Sets up `project.json`, `tsconfig.lib.json`, barrel `src/index.ts`
- Register the `importPath` in `tsconfig.base.json` manually if the generator doesn't — verify
  after running.
- Angular lib generator defaults: `linter: eslint`, `unitTestRunner: jest`.

### Application

```bash
nx g @nx/angular:application <name> --directory=apps/<name>
```

- Defaults: `style: scss`, `linter: eslint`, `unitTestRunner: jest`, `e2eTestRunner: none`.

### React / Vite (rao-widget, rao-demo)

```bash
# Library
nx g @nx/react:library <name> --directory=libs/<name> --unitTestRunner=vitest --bundler=vite

# Application
nx g @nx/react:application <name> --directory=apps/<name> --bundler=vite
```

React generator defaults: `style: css`, `linter: eslint`, `unitTestRunner: vitest`.

For deeper generator examples → see `references/generators.md`.

---

## project.json — Targets & Executors

Each project's `project.json` declares targets. Below are the canonical executor patterns
used in this workspace.

### Angular app build

```jsonc
"build": {
  "executor": "@angular-devkit/build-angular:browser",
  "options": {
    "outputPath": "dist/apps/<name>",
    "index": "apps/<name>/src/index.html",
    "main": "apps/<name>/src/main.ts",
    "polyfills": "apps/<name>/src/polyfills.ts",
    "tsConfig": "apps/<name>/tsconfig.app.json",
    "styles": ["apps/<name>/src/styles.scss"],
    "assets": [...]
  }
}
```

### Angular app serve

```jsonc
"serve": {
  "executor": "@angular-devkit/build-angular:dev-server",
  "options": {
    "buildTarget": "<name>:build"
  }
}
```

### Jest test (Angular / libs)

```jsonc
"test": {
  "executor": "@nx/jest:jest",
  "outputs": ["{workspaceRoot}/coverage/libs/<name>"],
  "options": {
    "jestConfig": "<projectRoot>/jest.config.js",
    "tsConfig": "<projectRoot>/tsconfig.spec.json"
  }
}
```

### ESLint lint

```jsonc
"lint": {
  "executor": "@nx/eslint:lint"
}
```

Vite-based projects (search-widget-demo, rao-demo, rao-widget) rely on the `@nx/vite/plugin`
inferred targets — they typically don't declare build/test manually in project.json.

### targetDefaults (nx.json)

From `nx.json`, these defaults apply workspace-wide:

| Target | `dependsOn` | `cache` |
|---|---|---|
| `build` | `^build` (deps first) | ✅ |
| `test` | — | ✅ |
| `@nx/jest:jest` | — | ✅ |
| `@nx/eslint:lint` | — | ✅ |

`dependsOn: ["^build"]` means a project's `build` will automatically build all its lib
dependencies first. Never break this by calling `nx build` on a lib that expects other libs
pre-built — just run on the app and Nx handles the order.

For detailed project.json patterns → see `references/project-json.md`.

---

## Affected Commands

Nx tracks which projects are affected by a code change via the project graph.

```bash
# Test only affected projects (vs main branch)
nx affected --target=test
nx affected --target=test --base=main --head=HEAD

# Build affected
nx affected --target=build

# Lint affected
nx affected --target=lint

# See which projects are affected without running anything
nx affected:graph
nx print-affected --target=test
```

### How affected is determined

Nx hashes:
1. Source files in each project's `sourceRoot`
2. `namedInputs` from `nx.json` (e.g., `sharedGlobals` includes `angular.json`, `nx.json`,
   `tsconfig.json`, `eslint.json`)
3. Dependency tree — changing `sdk-core` affects every Angular lib and app that imports it

> Tip: changing `nx.json` or `tsconfig.base.json` marks **all** projects as affected.

### Cache

`nx.json` enables caching for `build`, `test`, and `lint`. The cache lives in `.nx/cache/`.

```bash
# Skip cache for a single run
nx test common --skip-nx-cache

# Clear all cache
nx reset
```

---

## Adding a New App or Library

### Checklist

1. **Run the generator** (see Generators section above)
2. **Verify `tsconfig.base.json`** — confirm the new `paths` alias was added (or add manually)
3. **Set `prefix`** in `project.json` to the component selector prefix (e.g., `nsi`, `stf`, `nma`)
4. **Add an `AGENTS.md`** to the new project root describing its purpose, structure,
   and any routing/state conventions
5. **Tags** — add `"tags": []` (the current norm); only add real tags if the team has agreed
   to enforce a specific boundary rule

### Example — adding a new Angular lib

```bash
nx g @nx/angular:library my-feature \
  --directory=libs/my-feature \
  --importPath=@nuclia/my-feature \
  --prefix=nmf

# Verify tsconfig.base.json now has:
# "@nuclia/my-feature": ["libs/my-feature/src/index.ts"]
```

### Example — adding a new Angular component to an existing lib

```bash
nx g @nx/angular:component my-component \
  --project=common \
  --directory=src/lib/my-feature \
  --export
```

This auto-applies OnPush + SCSS from workspace defaults — do not add those flags manually.

---

## Common Mistakes

| Mistake | Fix |
|---|---|
| Using `ng g` instead of `nx g` | Always use `nx g` — `ng g` bypasses Nx defaults |
| Wrong project name in `nx test foo-lib` | Use the `"name"` from `project.json`, not the folder name |
| Forgetting `^build` dependency chain | Don't skip — always build via the app entry, not by chaining lib builds manually |
| Changing `nx.json` or `tsconfig.base.json` and expecting a narrow affected run | These files are in `sharedGlobals` — all projects become affected |
| Adding a lib import to an app without registering the path alias | Add to `tsconfig.base.json` `paths` **and** the app's `tsconfig.json` |
