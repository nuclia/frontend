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

| CLI name             | Type | Stack           | Path                       |
| -------------------- | ---- | --------------- | -------------------------- |
| `dashboard`          | app  | Angular 22      | `apps/dashboard/`          |
| `rao`                | app  | Angular 22      | `apps/rao/`                |
| `manager-v2`         | app  | Angular 22      | `apps/manager-v2/`         |
| `sistema-demo`       | app  | Angular 22      | `apps/sistema-demo/`       |
| `search-widget-demo` | app  | Svelte 5 + Vite | `apps/search-widget-demo/` |
| `sdk-core`           | lib  | TypeScript      | `libs/sdk-core/`           |
| `core`               | lib  | Angular         | `libs/core/`               |
| `common`             | lib  | Angular         | `libs/common/`             |
| `sistema`            | lib  | Angular         | `libs/sistema/`            |
| `user`               | lib  | Angular         | `libs/user/`               |
| `sync`               | lib  | Angular         | `libs/sync/`               |
| `search-widget`      | lib  | Svelte 5        | `libs/search-widget/`      |
| `pastanaga-angular`  | lib  | Angular         | `libs/pastanaga-angular/`  |
| `chrome-ext`         | lib  | Plain JS        | `libs/chrome-ext/`         |

> `@nx/eslint/plugin` infers `lint` targets for configured projects, including `common` and `core`.

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
- Angular lib generator defaults: `linter: eslint`, `unitTestRunner: vitest-angular`.

### Application

```bash
nx g @nx/angular:application <name> --directory=apps/<name>
```

- Defaults: `style: scss`, `linter: eslint`, `unitTestRunner: vitest-angular`, `e2eTestRunner: none`.

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

### Angular unit test (apps / libs with specs)

```jsonc
"test": {
  "executor": "@angular/build:unit-test",
  "outputs": ["{workspaceRoot}/coverage/libs/<name>"],
  "options": {
    "buildTarget": "<lib>:test-build", // libs own a test-build target; apps use "<app>:build:unit-test"
    "tsConfig": "<projectRoot>/tsconfig.spec.json",
    "providersFile": "test/translate-test-provider.ts",
    "runnerConfig": true, // picks up <projectRoot>/vitest-base.config.mts (coverage dir)
    "watch": false
  },
  "configurations": { "ci": { "coverage": true }, "watch": { "watch": true } }
}
```

The build configuration used as `buildTarget` must set `polyfills: []` (a file-path polyfill loads `zone.js`).
Every Angular project needs this official `test` target and at least one spec (the builder has no `passWithNoTests`).
`@nx/vitest` only infers a `test` target for the plain-Vitest projects (`sdk-core`, `chrome-ext`) listed in the plugin
`include` in `nx.json`.

### ESLint lint

Nx 24 removed the `@nx/eslint:lint` executor. The `@nx/eslint/plugin` configured in `nx.json`
infers `lint` targets from project ESLint configs; do not add explicit executor targets to
`project.json`. Use `nx lint <project>` to run them.

Vite-based projects (search-widget-demo) rely on the `@nx/vite/plugin`
inferred targets — they typically don't declare build/test manually in project.json.

### targetDefaults (nx.json)

From `nx.json`, these defaults apply workspace-wide:

| Target  | `dependsOn`           | `cache` |
| ------- | --------------------- | ------- |
| `build` | `^build` (deps first) | ✅      |
| `test`  | —                     | ✅      |

`dependsOn: ["^build"]` means a project's `build` will automatically build all its lib
dependencies first. Never break this by calling `nx build` on a lib that expects other libs
pre-built — just run on the app and Nx handles the order.
The ESLint plugin sets caching on its inferred lint targets.

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

`nx.json` enables caching for `build` and `test`; the ESLint plugin enables caching for inferred `lint` targets.
The cache lives in `.nx/cache/`.

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

| Mistake                                                                        | Fix                                                                              |
| ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| Using `ng g` instead of `nx g`                                                 | Always use `nx g` — `ng g` bypasses Nx defaults                                  |
| Wrong project name in `nx test foo-lib`                                        | Use the `"name"` from `project.json`, not the folder name                        |
| Forgetting `^build` dependency chain                                           | Don't skip — always build via the app entry, not by chaining lib builds manually |
| Changing `nx.json` or `tsconfig.base.json` and expecting a narrow affected run | These files are in `sharedGlobals` — all projects become affected                |
| Adding a lib import to an app without registering the path alias               | Add to `tsconfig.base.json` `paths` **and** the app's `tsconfig.json`            |
