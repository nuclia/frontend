# Generators Reference

Detailed generator usage for this workspace. Always use `nx g` (not `ng g`).

---

## Workspace Generator Defaults

From `nx.json` — these apply to every `nx g` invocation automatically:

```jsonc
// Angular component (all projects)
"@nx/angular:component": {
  "style": "scss",
  "changeDetection": "OnPush",
  "type": "component"
}

// Angular library
"@nx/angular:library": {
  "linter": "eslint",
  "unitTestRunner": "jest"
}

// Angular application
"@nx/angular:application": {
  "style": "scss",
  "linter": "eslint",
  "unitTestRunner": "jest",
  "e2eTestRunner": "none"
}

// React library
"@nx/react:library": {
  "style": "css",
  "linter": "eslint",
  "unitTestRunner": "vitest"
}

// React application
"@nx/react:application": {
  "babel": true,
  "style": "css",
  "linter": "eslint",
  "unitTestRunner": "vitest"
}
```

---

## Component

```bash
# Angular standalone component in a lib
nx g @nx/angular:component <name> \
  --project=<lib-name> \
  --directory=src/lib/<feature-dir>

# With explicit export (adds to index.ts)
nx g @nx/angular:component kb-list \
  --project=common \
  --directory=src/lib/kb \
  --export

# In an app (no --export needed)
nx g @nx/angular:component settings-page \
  --project=dashboard \
  --directory=src/app/settings
```

Result: creates `<name>.component.ts`, `<name>.component.html`, `<name>.component.scss`,
`<name>.component.spec.ts` — all with OnPush and SCSS preset from workspace defaults.

Do NOT pass `--changeDetection=OnPush` or `--style=scss` — they're already the default.

---

## Service

```bash
nx g @nx/angular:service <name> \
  --project=<project> \
  --directory=src/lib/<subdir>
```

Result: `<name>.service.ts` and `<name>.service.spec.ts`.
Uses `inject()` pattern — no constructor injection in services.

---

## Directive / Pipe / Guard

```bash
# Directive
nx g @nx/angular:directive <name> --project=<project> --directory=src/lib/<dir>

# Pipe
nx g @nx/angular:pipe <name> --project=<project> --directory=src/lib/<dir>

# Functional guard
nx g @nx/angular:guard <name> --project=<project> --directory=src/app/<dir>
# When prompted for interface, choose "CanActivateFn" (functional, not class-based)
```

---

## New Angular Library

```bash
nx g @nx/angular:library <name> \
  --directory=libs/<name> \
  --importPath=@nuclia/<name> \
  --prefix=<selector-prefix>
```

**After running**, verify and fix up:

1. `tsconfig.base.json` — ensure `paths` has the new alias:
   ```jsonc
   "@nuclia/<name>": ["libs/<name>/src/index.ts"]
   ```
2. `libs/<name>/project.json` — set `"prefix"` to your chosen selector prefix.
3. `libs/<name>/src/index.ts` — the barrel file. Export public API from here only.
4. Create `libs/<name>/AGENTS.md` describing the lib's purpose and structure.

Selector prefix conventions in this workspace:
| Lib | Prefix |
|---|---|
| `sistema` | `nsi` |
| `user` | `nus` |
| `sync` | `nsy` |
| `common` | `stf` |
| `manager-v2` internal | `nma` |
| new libs (nuclia-owned) | `n<2-letter-abbrev>` |

---

## New Angular Application

```bash
nx g @nx/angular:application <name> \
  --directory=apps/<name> \
  --routing=true \
  --style=scss
```

**After running**, add:
1. `apps/<name>/src/environments_config/` directory with per-environment config folders
2. Build target configurations (`local-dev`, `local-stage`, `local-prod`, `production`) in
   `project.json` — copy the pattern from `apps/dashboard/project.json`
3. Asset globs for lib i18n files (see dashboard's `assets` array in `project.json`)
4. `apps/<name>/AGENTS.md`

---

## New React / Vite Library (rao-widget pattern)

```bash
nx g @nx/react:library <name> \
  --directory=libs/<name> \
  --importPath=<name> \
  --unitTestRunner=vitest \
  --bundler=vite
```

Verify `vite.config.ts` is generated. Inferred targets (`build`, `test`) come from
`@nx/vite/plugin` in `nx.json` — no manual project.json targets needed.

---

## New React / Vite Application

```bash
nx g @nx/react:application <name> \
  --directory=apps/<name> \
  --bundler=vite \
  --unitTestRunner=vitest
```

The serve target uses `nx:run-commands` with a direct `vite` call (see `rao-demo` pattern).

---

## Dry Run First

Always preview changes before committing:

```bash
nx g @nx/angular:component my-component --project=common --dry-run
```

This shows exactly what files will be created/modified without touching the filesystem.

---

## Generator Schema Help

To see all options for a generator:

```bash
nx g @nx/angular:component --help
nx g @nx/angular:library --help
```
