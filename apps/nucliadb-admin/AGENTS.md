# nucliadb-admin — Agent Reference Guide

## Overview

`nucliadb-admin` is an Angular 21 admin UI for **self-hosted NucliaDB** instances. Key characteristics:

- Deployed at `/admin/` with **hash-based routing** (`useHash: true`).
- OAuth post-redirect URL repair: `AppComponent` rewrites `/admin/admin/` → `/#/admin/`.
- Always `environment.standalone = true` — no Nuclia cloud account needed.
- App shell is intentionally thin — almost all features come from `libs/`.
- i18n assembled from three bundles: `user`, `common`, `sync`.
- **Component selector prefix:** `nad`

---

## Project Structure

```
apps/nucliadb-admin/src/
├── styles.scss / _variables.scss
├── environments/           # standalone: true in both
├── environments_config/    # production/ only (Docker substitution)
└── app/
    ├── app.module.ts           # Root NgModule
    ├── app-routing.ts          # Hash routing with paramsInheritanceStrategy: 'always'
    ├── app.component.ts        # Root: i18n init, OAuth repair, toast block
    ├── app-title.strategy.ts   # "NucliaDB – <title>"
    └── home/
        ├── home-page.component.ts  # Standalone: NUA key validity + version status
        └── main-container/         # Standalone: thin router-outlet wrapper
```

---

## Routing Architecture (hash-based)

All URLs are hash-prefixed: `http://localhost:4200/admin/#/at/local/my-kb-id/resources`

```
''   [rootGuard] → redirects to landing

'at/:account'  [setAccountGuard]
  '/:kb'  [setLocalKbGuard]
    ''             → HomePageComponent  (NUA key + version info)
    'resources'   → ResourcesModule (lazy, libs/common)
    'upload'      → UploadModule (lazy, libs/common)
    'search'      → SearchPageComponent (libs/common)
    'sync'        → SYNC_ROUTES (lazy, libs/sync)
    'manage'      → KnowledgeBoxSettingsComponent (libs/common)
    'ai-models'   → AiModelsComponent (libs/common)
    'label-sets'  → LabelSetsModule (lazy, libs/core)
    'entities'    → EntitiesModule (lazy, libs/common)
    'widgets'     → WIDGETS_ROUTES (lazy, libs/common)
  'manage/kbs/create' → KbCreationComponent (libs/common)

'select'  → SelectAccountComponent
  '/:account' [selectKbGuard] → SelectKbComponent

'**' → PageNotFoundComponent
```

---

## AppModule Responsibilities

- `STFConfigModule.forRoot(environment)` — `APP_INITIALIZER` fetches `assets/deployment/app-config.json`, initialises Sentry, injects widget/ARAG-widget scripts from CDN.
- `TranslateModule.forRoot` with `MultiTranslateHttpLoader` merging `user`, `common`, `sync` bundles.
- `{ APP_BASE_HREF: '/admin' }` + `TitleStrategy: AppTitleStrategy`.

---

## Key App-level Components

| Component                | Selector             | Responsibility                                                                                                                          |
| ------------------------ | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `AppComponent`           | `nad-root`           | i18n init, drag-drop prevention, version string, OAuth URL repair                                                                       |
| `HomePageComponent`      | `nad-home-page`      | NUA API key validity status + NucliaDB/admin-assets version checks (`StandaloneService`). **Not standalone** — declared in `AppModule`. |
| `MainContainerComponent` | `nad-main-container` | Thin `<router-outlet>` wrapper (**standalone**, OnPush)                                                                                 |

---

## Guards Summary

| Guard             | Applied To        | Behaviour                                                                           |
| ----------------- | ----------------- | ----------------------------------------------------------------------------------- |
| `rootGuard`       | `''`              | Calls `NavigationService.goToLandingPage()`, always returns `false`.                |
| `setAccountGuard` | `at/:account`     | Sets SDK current account from slug. Redirects to `/select` if missing.              |
| `setLocalKbGuard` | `at/:account/:kb` | Sets SDK current KB; standalone-aware (`'local'` account placeholder).              |
| `selectKbGuard`   | `select/:account` | Waits for KB/ARAG lists. Standalone: always returns `true`; cloud: routes by count. |

---

## Standalone Mode (Always Active)

`environment.standalone = true` affects:

- **`StandaloneService`** — activates NUA key validity check via `/config-check` and version check via `/versions`.
- **`selectKbGuard`** — skips zone API calls; uses `'local'` as account slug.
- **`setLocalKbGuard`** — uses account slug as placeholder (KB identified by ID only).

---

## SCSS Design System

```scss
// src/_variables.scss (available via includePaths)
@import '../../../libs/sistema/styles/variables';

// src/styles.scss
@use '../../../libs/sistema/styles/apps-common';
@use '../../../libs/pastanaga-angular/.../core';
```

Tokens: `rhythm($n)` (4px grid spacing), `$color-primary-*`, CSS vars set by `_apps-common.scss` (e.g. `--app-background-color`, `--app-topbar-height`).

---

## Running Locally

```bash
nx serve nucliadb-admin           # local-stage config (default)
nx serve nucliadb-admin -c local-stage
nx build nucliadb-admin           # dist/apps/nucliadb-admin/
nx test nucliadb-admin
```

App runs at `http://localhost:4200/admin/` (hash routes: `http://localhost:4200/admin/#/...`).

---

## Important Conventions

1. **Hash routing** — always test routes with the `#` prefix. `APP_BASE_HREF: '/admin'`.
2. **`paramsInheritanceStrategy: 'always'`** — child routes read `:account`, `:kb` from `ActivatedRoute.snapshot.paramMap` without traversing parent chain.
3. **Standalone mode** — `environment.standalone = true` always. Guards skip zone API; `StandaloneService` runs NUA key check.
4. **Component prefix `nad`** — all app-level selectors start `nad-`.
5. **Runtime config** — never hardcode backend URLs; access via `BackendConfigurationService` (reads `window.config` from `AppInitService`).
6. **OAuth URL repair** — `AppComponent` constructor checks if `location.pathname` starts with `/admin/admin/` and rewrites to `/#/admin/`. This handles OAuth redirects that incorrectly double the base path.
7. **Module boundary workarounds** — lazy routes reference lib internals directly (`import('../../../../libs/common/src/lib/...')`); suppress with `// eslint-disable-next-line @nx/enforce-module-boundaries`.
8. **i18n** — three bundles merged: `assets/i18n/user/`, `assets/i18n/common/`, `assets/i18n/sync/`. `PaTranslateModule` must be imported in root module for Pastanaga locale-aware components.
9. **Sentry** — production only; activated by `AppInitService` from `app-config.json` `sentry_url`. Never hardcoded.
