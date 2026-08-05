# Manager V2 App — Agent Reference Guide

## Overview

**Manager V2** (`apps/manager-v2`) is an internal Angular administration console for Nuclia back-office operators (ROOT, MANAGER, READONLY roles). Manages:

- **Accounts** — create, configure, delete; manage limits, blocked features, KBs, custom AI models.
- **Users** — global platform user CRUD.
- **Zones** — NucliaDB deployment zones (cloud regions, subdomain config).

Role-based access is enforced via `ManagerStore` permission observables derived from `UserService.userType`.  
**Angular version:** 21 · **Component prefix:** `nma` · **Change detection:** `OnPush`

---

## Project Structure

```
apps/manager-v2/src/
├── styles.scss / _variables.scss   # imports sistema + pastanaga; $header-height: rhythm(8)
├── environments/ environments_config/production/
└── app/
    ├── app.module.ts               # Root NgModule
    ├── app.routes.ts               # Top-level routes
    ├── app.component.ts            # Thin config-ready shell: shows Loading… until AppInitService resolves, then renders MainComponent
    ├── main.component.ts           # Bootstraps translations/remote-login and hosts the router-outlet + toast container; no header/nav (that's AppLayoutComponent)
    ├── manager.store.ts            # Global reactive store (BehaviorSubjects + permissions)
    ├── app-layout/                 # Shell: header nav, avatar, permission-gated router-outlet
    ├── manage-accounts/            # lazy NgModule: AccountService, account CRUD components
    │   ├── account.service.ts      # High-level orchestrator (global + regional + store)
    │   ├── global-account.service.ts   # REST: /manage/@account(s) (global API) + per-account budget endpoints
    │   ├── regional-account.service.ts # Zone-aware REST (KBs, models, per-zone Nuclia instances)
    │   └── account-details/            # ManagerStore-backed sub-detail components (account-details.store.ts exists but is unused in app code, only referenced by spec mocks)
    ├── manage-users/               # lazy NgModule: UserService, user CRUD
    └── manage-zones/               # lazy NgModule: ZoneService, zone CRUD
```

---

## Routing Architecture

```
/                           → redirect to /accounts
AppLayoutComponent (canActivate: authGuard)
├── /accounts               → ManageAccountsModule (lazy)
│   ├── /accounts           → AccountListComponent
│   ├── /accounts/add       → AddAccountComponent
│   └── /accounts/:id       → AccountDetailsComponent
│       ├── /config         → ConfigurationComponent
│       ├── /kbs            → KnowledgeBoxesComponent
│       ├── /zone/:z/kb/:k  → KbDetailsComponent
│       ├── /limits         → LimitsComponent
│       ├── /tokens         → TokenConsumptionComponent (standalone)
│       ├── /users          → UsersComponent
│       ├── /payment-links  → PaymentLinksComponent
│       ├── /subscriptions  → SubscriptionsComponent ('cloud zero' and 'manual' subscription forms)
│       ├── /models         → ModelsComponent (standalone)
│       ├── /models/add     → AddModelComponent (standalone)
│       ├── /models/:z/model/:m      → AddModelComponent (edit mode, standalone)
│       └── /models/:z/model/:m/kbs → ModelDetailsComponent (standalone)
├── /users                  → ManageUsersModule (lazy)
│   ├── /users              → UserListComponent
│   ├── /users/add          → AddUserComponent
│   └── /users/:id[/edit]   → UserDetailsComponent
└── /zones                  → ManageZonesModule (lazy)
    ├── /zones              → ZoneListComponent
    └── /zones/:id          → ZoneDetailsComponent  (:id = "add" → create mode)
/user/callback               → CallbackComponent (from @nuclia/user, no authGuard)
/user/login-redirect         → AppLoginComponent (from @nuclia/user, no authGuard)
```

---

## State Management

### `ManagerStore` (`src/app/manager.store.ts`)

BehaviorSubject-based reactive store (`providedIn: 'root'`). Central source for:

- `accountDetails`, `kbList`, `kbDetails`, `blockedFeatures`, `accountUsers`, `accountModels`, `currentState` — currently loaded account data
- `canEdit`, `canDelete`, `canFullyEditAccount`, `canSeeUsers`, `canCreateUser`, `canCreateAccount`, `canManageZones`, `canManageModels`, `canAccessKBs`, `canUseManager` — permission observables derived from `UserService.userType`

**All UI permission checks use `ManagerStore` observables — never access `UserService.userType` directly from components.**

### `AccountDetailsStore` (`manage-accounts/account-details/account-details.store.ts`)

A second `ExtendedAccount`/KB/zones store exists but is **not wired into any component or service** — only test spec files still `MockProvider` it. Treat `ManagerStore` as the single source of truth for account-detail state; don't add new dependents on `AccountDetailsStore` without checking it's still intentional.

### `ZoneService` (`manage-zones/zone.service.ts`)

Eagerly loads all zones on construction. Exposes `zones` as a BehaviorSubject. Helpers: `getZoneDict()`, `getZoneSlug(id)`.

---

## Service Architecture

**Two-layer account service pattern:**

- `GlobalAccountService` — global (non-zone) API at `/manage/@accounts` (CRUD, limits, blocked features, users, payment links, subscriptions) plus per-account budget endpoints (`GET/POST/PATCH/DELETE /billing/account/:id/budget`).
- `RegionalAccountService` — resolves zone slugs from `ZoneService`, instantiates per-zone `Nuclia` client instances for KB data.
- `AccountService` — composes both, keeps `ManagerStore` in sync after every mutation.

Grafana/Redash monitoring URLs are built in `RegionalAccountService.getKbList()` with special handling for the `europe-1` zone slug (remapped to `flaps` cluster).

`ConfigurationComponent` saves the account config form and the budget form together via `forkJoin` — budget is only fetched/editable when `ManagerStore.canFullyEditAccount` is true; when disabled the budget request is skipped (`of(null)`) instead of calling the API.

---

## Guard Summary

| Guard                       | Behaviour                                                                                                                                                                                         |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `authGuard` (`@flaps/core`) | Checks `JWT_KEY` in localStorage (or a magic `?token=` param). Redirects to `/user/login-redirect` + saves intended URL/query params. Applied to `AppLayoutComponent` and all three child routes. |

---

## SCSS Design System

```scss
// _variables.scss
@import '../../../libs/sistema/styles/variables';
$header-height: rhythm(8);

// styles.scss
@use '../../../libs/sistema/styles/apps-common';
@use '../../../libs/pastanaga-angular/.../styles/core';
```

Component stylesheets: `@use 'variables'` (via `stylePreprocessorOptions.includePaths`).

Layout: `.pa-main-container` + `.pa-main-side-panel` (left nav) + `.pa-main-container-wide`. Side panel: `height: calc(100vh - #{$header-height}); overflow: auto`.

---

## Running Locally

```bash
nx serve manager-v2              # local-stage (default)
nx serve manager-v2 -c local-prod
nx build manager-v2
nx test manager-v2
```

Runtime config: `assets/deployment/app-config.json` (local: `environments_config/local-stage/`, production: Docker `30-environment-manager.sh` substitution).

---

## Important Conventions

1. **NgModule-based with selective standalone** — `TokenConsumptionComponent`, `ModelsComponent`, `AddModelComponent`, `ModelDetailsComponent` are standalone (no `standalone: false`, Angular 19+ default). They're referenced only via `component:` in the lazy `Routes` array — not added to the feature module's `declarations[]` or `imports[]` at all. `ZoneListComponent` and `ZoneDetailsComponent` explicitly opt out with `standalone: false` and are declared in `ManageZonesModule`.
2. **ManagerStore as permissions bus** — always read permissions from `ManagerStore` (`canEdit`, `canDelete`, etc.).
3. **Lazy-loaded feature modules** — `accounts`, `users`, `zones` all use `loadChildren`. Keep it that way.
4. **Two-layer account service** — `GlobalAccountService` for global mutations; `RegionalAccountService` for zone-aware reads; `AccountService` orchestrates both.
5. **Zone route dual-use** — `/zones/:zoneId` shares `ZoneDetailsComponent` for create (`:zoneId = 'add'`) and edit.
6. **Component prefix `nma`** — all selectors must start `nma-`.
7. **Runtime config** — never hardcode backend URLs; use `BackendConfigurationService`.
8. **`/user/callback` and `/user/login-redirect`** — top-level routes (siblings of the guarded shell route, no `authGuard`) rendering `CallbackComponent` / `AppLoginComponent` imported directly from `@nuclia/user`.
9. **`AppComponent` is a config-ready shell** — it renders `Loading…` until `AppInitService` resolves, then switches to `<nma-main>` (`MainComponent`). `MainComponent` only bootstraps translations/remote-login and hosts `<router-outlet>` + the toast container; the header/nav/avatar layout lives in `AppLayoutComponent`, not `MainComponent`. Never put feature UI in `AppComponent`.
