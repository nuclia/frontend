# Manager V2 App — Agent Reference Guide

## Overview

**Manager V2** (`apps/manager-v2`) is an internal Angular administration console for Nuclia back-office operators (ROOT, MANAGER, READONLY roles). Manages:
- **Accounts** — create, configure, delete; manage limits, blocked features, KBs, custom AI models.
- **Users** — global platform user CRUD.
- **Zones** — NucliaDB deployment zones (cloud regions, subdomain config).

Role-based access is enforced via `ManagerStore` observables derived from `UserType`.  
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
    ├── main.component.ts           # Main shell (formerly app.component): header nav, avatar, permission-gated router-outlet, translations
    ├── manager.store.ts            # Global reactive store (BehaviorSubjects + permissions)
    ├── app-layout/                 # Shell: header nav, avatar, permission-gated router-outlet
    ├── manage-accounts/            # lazy NgModule: AccountService, account CRUD components
    │   ├── account.service.ts      # High-level orchestrator (global + regional + store)
    │   ├── global-account.service.ts   # REST: /manage/@account(s) (global API)
    │   ├── regional-account.service.ts # Zone-aware REST (KBs, models, per-zone Nuclia instances)
    │   └── account-details/            # AccountDetailsStore + sub-detail components
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
│       ├── /models         → ModelsComponent (standalone)
│       ├── /models/add     → AddModelComponent (standalone)
│       └── /models/:z/model/:m  → AddModelComponent (edit) / ModelDetailsComponent
├── /users                  → ManageUsersModule (lazy)
│   ├── /users              → UserListComponent
│   ├── /users/add          → AddUserComponent
│   └── /users/:id[/edit]   → UserDetailsComponent
└── /zones                  → ManageZonesModule (lazy)
    ├── /zones              → ZoneListComponent
    └── /zones/:id          → ZoneDetailsComponent  (:id = "add" → create mode)
/user                       → UserModule (login, OAuth — no authGuard)
```

---

## State Management

### `ManagerStore` (`src/app/manager.store.ts`)
BehaviorSubject-based reactive store (`providedIn: 'root'`). Central source for:
- `accountDetails`, `kbSummaries`, `zones` — currently loaded account data
- `canEdit`, `canDelete`, `canManageUsers` — permission observables derived from `UserService.userType`
- `isReadOnly`, `isManager`, `isRoot` — computed role flags

**All UI permission checks use `ManagerStore` observables — never access `UserService.userType` directly from components.**

### `AccountDetailsStore` (`manage-accounts/account-details/account-details.store.ts`)
Secondary store for the account detail view: `ExtendedAccount`, KB summaries, zones.

### `ZoneService` (`manage-zones/zone.service.ts`)
Eagerly loads all zones on construction. Exposes `zones` as a BehaviorSubject. Helpers: `getZoneDict()`, `getZoneSlug(id)`.

---

## Service Architecture

**Two-layer account service pattern:**
- `GlobalAccountService` — global (non-zone) API at `/manage/@accounts` (CRUD, limits, blocked features, users, payment links).
- `RegionalAccountService` — resolves zone slugs from `ZoneService`, instantiates per-zone `Nuclia` client instances for KB data.
- `AccountService` — composes both, keeps `ManagerStore` in sync after every mutation.

Grafana/Redash monitoring URLs are built in `RegionalAccountService.getKbList()` with special handling for the `europe-1` zone slug (remapped to `flaps` cluster).

---

## Guard Summary

| Guard | Behaviour |
|---|---|
| `authGuard` (`@flaps/core`) | Checks `JWT_KEY` in localStorage. Redirects to `/user/login` + saves intended URL. Applied to `AppLayoutComponent` and all three child routes. |

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

1. **NgModule-based with selective standalone** — `TokenConsumptionComponent`, `ModelsComponent`, `AddModelComponent`, `ModelDetailsComponent` are standalone (Angular 19+). Declared in feature module as `imports[]`, not `declarations[]`.
2. **ManagerStore as permissions bus** — always read permissions from `ManagerStore` (`canEdit`, `canDelete`, etc.).
3. **Lazy-loaded feature modules** — `accounts`, `users`, `zones` all use `loadChildren`. Keep it that way.
4. **Two-layer account service** — `GlobalAccountService` for global mutations; `RegionalAccountService` for zone-aware reads; `AccountService` orchestrates both.
5. **Zone route dual-use** — `/zones/:zoneId` shares `ZoneDetailsComponent` for create (`:zoneId = 'add'`) and edit.
6. **Component prefix `nma`** — all selectors must start `nma-`.
7. **Runtime config** — never hardcode backend URLs; use `BackendConfigurationService`.
8. **Module boundary exception** — `UserModule` route uses a direct relative path import (suppressed with eslint-disable comment). Prefer `@nuclia/user` alias for future work.
9. **`AppComponent` is a config-ready shell** — it renders `Loading…` until `AppInitService` resolves, then switches to `<nma-main>` (`MainComponent`). The actual layout and translations live in `MainComponent`. Never put feature UI in `AppComponent`.
