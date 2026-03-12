# Module Boundaries Reference

Deep-dive reference for `@nx/enforce-module-boundaries` as configured in this workspace.

---

## Current ESLint Configuration

From `eslint.config.mts`:

```ts
"@nx/enforce-module-boundaries": [
  "error",
  {
    enforceBuildableLibDependency: true,
    allow: [],
    depConstraints: [
      {
        sourceTag: "*",
        onlyDependOnLibsWithTags: ["*"]
      }
    ]
  }
]
```

### What is enforced right now

| Rule | Enforced? | How |
|---|---|---|
| Apps cannot import from other apps | ✅ (architectural) | Code review + cross-project import check |
| Only buildable libs can depend on other buildable libs | ✅ | `enforceBuildableLibDependency: true` |
| Tag-based constraints (e.g., `scope:shared` only) | ❌ | Wildcard `*→*` disables this |

The wildcard constraint `"sourceTag": "*", "onlyDependOnLibsWithTags": ["*"]` is effectively
a no-op restriction. This means Nx does NOT block any import based on tags today.

---

## Why App→App Imports Are Still Wrong

Even without tag enforcement, importing from one app into another creates:
1. Circular dependency risks
2. Bundle bloat (the imported app's entire module tree can be pulled in)
3. Breaking the assumption that each app is independently deployable

If two apps share a feature, extract it to `libs/common` or a new dedicated lib.

---

## Known Exceptions (Intentional eslint-disable)

Some lazy-loaded feature routes use relative paths across lib boundaries to avoid
circular dependency issues at load time. These are suppressed intentionally:

```ts
// eslint-disable-next-line @nx/enforce-module-boundaries
import { SomeFeatureModule } from '../../../../libs/some-feature/src/lib/some-feature.module';
```

**Do not remove these comments.** They are architectural decisions, not mistakes. If you
see one, leave it alone unless you're refactoring the entire lazy-loading structure.

---

## How to Add Tag-Based Constraints (Future)

If the team decides to enforce tag boundaries, here is the pattern:

### Step 1 — Tag all projects

In each `project.json`:
```jsonc
{
  "tags": ["scope:ui", "type:feature"]   // or "scope:shared", "type:util", etc.
}
```

### Step 2 — Add constraints to eslint.config.mts

```ts
depConstraints: [
  // Features can use shared libs but not other features
  {
    sourceTag: "type:feature",
    onlyDependOnLibsWithTags: ["type:feature", "type:util", "scope:shared"]
  },
  // UI libs can only use shared utilities
  {
    sourceTag: "scope:ui",
    onlyDependOnLibsWithTags: ["scope:shared", "type:util"]
  }
]
```

**Do not add constraints without team agreement** — the current empty-tags baseline is
intentional.

---

## Debugging a Boundary Violation

```
Error: A project tagged with "X" can only depend on libs tagged with "Y"
```

1. Check the project's tags: `cat libs/my-lib/project.json | grep tags`
2. Check the imported lib's tags: `cat libs/imported-lib/project.json | grep tags`
3. Decide: is this import architecturally correct?
   - **Yes** → either relax the constraint or add/adjust tags
   - **No** → move shared code to the right lib

```bash
# Visualise the project graph to understand dependencies
nx graph
```

---

## Project Dependency Graph

To understand what depends on what:

```bash
# Open interactive graph in browser
nx graph

# JSON output of all dependencies
nx print-affected --all --json

# Show what a specific project depends on
nx show project sdk-core --web
```

Dependency hierarchy (general):
```
apps/
  dashboard, rao, manager-v2, nucliadb-admin
      ↓ imports
  libs/common, libs/core, libs/sistema, libs/user, libs/sync
      ↓ imports
  libs/sdk-core  (no Angular, pure TS — imported by everything)
```
