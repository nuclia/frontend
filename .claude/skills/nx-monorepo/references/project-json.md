# project.json Reference

Deep-dive reference for `project.json` target patterns used across this workspace.

---

## Angular App — Full Target Set

Based on `apps/dashboard/project.json` (the most complete example).

### build

```jsonc
"build": {
  "executor": "@angular-devkit/build-angular:browser",
  "outputs": ["{options.outputPath}"],
  "options": {
    "outputPath": "dist/apps/dashboard",
    "subresourceIntegrity": true,
    "index": "apps/dashboard/src/index.html",
    "main": "apps/dashboard/src/main.ts",
    "polyfills": "apps/dashboard/src/polyfills.ts",
    "tsConfig": "apps/dashboard/tsconfig.app.json",
    "styles": ["apps/dashboard/src/styles.scss"],
    "allowedCommonJsDependencies": [],
    "assets": [
      "apps/dashboard/src/favicon.ico",
      "apps/dashboard/src/assets",
      // Glob assets copy lib i18n into app bundle:
      {
        "glob": "**/*",
        "input": "libs/common/src/assets/i18n",
        "output": "assets/i18n/common"
      }
    ],
    "budgets": [
      { "type": "initial",          "maximumWarning": "2mb",  "maximumError": "30mb" },
      { "type": "anyComponentStyle","maximumWarning": "50kb", "maximumError": "100kb" }
    ]
  },
  "configurations": {
    "production": {
      "outputHashing": "all",
      "serviceWorker": true,
      "fileReplacements": [
        {
          "replace": "apps/dashboard/src/environments/environment.ts",
          "with":    "apps/dashboard/src/environments/environment.prod.ts"
        }
      ]
    },
    "local-stage": {
      "aot": false,
      "sourceMap": true,
      "optimization": false,
      "vendorChunk": true,
      "extractLicenses": false,
      "namedChunks": true,
      "subresourceIntegrity": false,
      "buildOptimizer": false
    }
  },
  "defaultConfiguration": "production"
}
```

Key points:
- `"outputs": ["{options.outputPath}"]` — Nx uses this for cache invalidation; always set it.
- `assets` array copies i18n files from libs into the app's `assets/` at build time.
- `fileReplacements` swaps environment files per configuration.
- Each app has its own deployment configurations: `production`, `local-stage`, `local-dev`, `local-prod`.

### serve

```jsonc
"serve": {
  "executor": "@angular-devkit/build-angular:dev-server",
  "options": {
    "buildTarget": "dashboard:build"
  },
  "configurations": {
    "production":  { "buildTarget": "dashboard:build:production"  },
    "local-stage": { "buildTarget": "dashboard:build:local-stage" },
    "local-dev":   { "buildTarget": "dashboard:build:local-dev"   }
  },
  "defaultConfiguration": "local-stage",
  "continuous": true
}
```

`defaultConfiguration: "local-stage"` means `nx serve dashboard` uses local-stage by default.

### test

```jsonc
"test": {
  "executor": "@nx/jest:jest",
  "outputs": ["{workspaceRoot}/coverage/apps/dashboard"],
  "options": {
    "jestConfig": "apps/dashboard/jest.config.js",
    "tsConfig": "apps/dashboard/tsconfig.spec.json"
  }
}
```

### extract-i18n

```jsonc
"extract-i18n": {
  "executor": "@angular-devkit/build-angular:extract-i18n",
  "options": {
    "buildTarget": "dashboard:build"
  }
}
```

---

## Angular Library — Minimal Target Set

Angular libs in this workspace typically have only `test` (and sometimes `lint`) declared
in `project.json`. There is **no `build` target** because libs are consumed directly via
path aliases (see `tsconfig.base.json`) — they compile as part of the app, not standalone.

```jsonc
// libs/common/project.json
{
  "name": "common",
  "projectType": "library",
  "sourceRoot": "libs/common/src",
  "prefix": "stf",
  "tags": [],
  "generators": {
    "@nx/angular:component": {
      "style": "scss",
      "changeDetection": "OnPush"
    }
  },
  "targets": {
    "test": {
      "executor": "@nx/jest:jest",
      "outputs": ["{workspaceRoot}/coverage/libs/common"],
      "options": {
        "jestConfig": "libs/common/jest.config.js",
        "tsConfig": "libs/common/tsconfig.spec.json"
      }
    }
  }
}
```

`common` and `core` have no `lint` target — ESLint runs during app build. `sistema` and
some others do have an explicit `lint` target.

---

## Vite / React App — Minimal project.json

Vite apps (`rao-demo`, `search-widget-demo`) use mostly inferred targets from the
`@nx/vite/plugin` registered in `nx.json`. The `project.json` only needs to declare
targets that deviate from inference:

```jsonc
// apps/rao-demo/project.json
{
  "name": "rao-demo",
  "projectType": "application",
  "sourceRoot": "apps/rao-demo/src",
  "tags": [],
  "targets": {
    "serve": {
      "executor": "nx:run-commands",
      "options": {
        "command": "cd apps/rao-demo && vite"
      }
    }
  }
}
```

React/Vite targets like `build` and `test` are inferred from `vite.config.ts` — do not
add them manually unless you need to override an inferred option.

---

## Custom / Script Targets

When a target just runs a shell command:

```jsonc
"generate-api": {
  "executor": "nx:run-commands",
  "options": {
    "command": "node tools/generate-api.mjs",
    "cwd": "{workspaceRoot}"
  }
}
```

---

## Adding a Target to an Existing Project

1. Open the project's `project.json`
2. Add the target inside `"targets": {}`
3. Always set `"outputs"` so Nx can cache correctly
4. Run `nx <target> <project>` to verify

Do NOT add `"dependsOn"` unless the target genuinely requires another to run first —
`nx.json`'s `targetDefaults` already handles `build → ^build`.
