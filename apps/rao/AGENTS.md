# RAO App — Agent Reference Guide

## Overview

`apps/rao` is an Angular (NgModule-based) frontend for Nuclia's **RAO (Retrieval Agent Only)** platform — a white-label deployment targeting Progress (`rag.progress.cloud`). Unlike `apps/dashboard`, this app has **no KB management** — only ARAG (Retrieval Agent) workflows. All feature logic lives in `libs/common`.

**Entry point:** `main.ts` → `AppModule` → `AppComponent`  
**Angular version:** 21 · **Change detection:** `OnPush` (generator default) · **Component selector:** none (app-level only)

---

## Project Structure

```
apps/rao/src/
├── main.ts / index.html / manifest.webmanifest / ngsw-config.json
├── styles.scss                # imports libs/sistema/styles/apps-common + pastanaga/core
├── _variables.scss            # @forward '../../../libs/sistema/styles/variables'
├── environments/              # environment.ts (client: 'rao') + environment.prod.ts
├── environments_config/       # local-prod/ (rag.progress.cloud) + production/ (Docker)
└── app/
    ├── app.module.ts          # Root NgModule, interceptors, i18n
    ├── app-routing.module.ts  # Full routing tree
    ├── app.component.ts       # Root: translations, auth, splash screen
    ├── app-title.strategy.ts  # Custom TitleStrategy (account + agent in tab title)
    └── lazy-user.module.ts    # Lazy wrapper around @nuclia/user
```

---

## Routing Architecture

```
/                          → BaseComponent (canActivate: authGuard)
  /                        → EmptyComponent (canActivate: rootGuard)
  /redirect                → RedirectComponent
  /at/:account             [canActivate: setAccountGuard]
    /                      → redirect to /manage
    /manage                → AccountModule (lazy)
    /:zone/arag/:agent     [canActivate: setAgentGuard]
      /                    → redirect to /workflows
      /workflows           → WorkflowsComponent
        /                  → WorkflowsListComponent
        /:id               → AgentDashboardComponent
      /sessions            → SessionsComponent
        /                  → SessionsListComponent
        /:id/edit          → EditResourceComponent (data: { mode: 'arag' })
      /drivers             → DriversPageComponent
      /search              → SearchPageComponent
      /widgets             → WIDGETS_ROUTES (lazy)
      /manage              → KnowledgeBoxSettingsComponent
      /ai-models           → AiModelsComponent
      /activity            → AgentActivityComponent
      /users               → KnowledgeBoxUsersComponent (aragOwnerGuard)
      /keys                → KnowledgeBoxKeysComponent (aragOwnerGuard)
/select                    [authGuard, selectAccountGuard]
  /:account                → SelectKbComponent [selectKbGuard]
/feedback                  → FeedbackComponent [authGuard]
/farewell                  → FarewellComponent
/setup_account             → AwsOnboardingComponent [awsGuard]
/user/profile              → ProfileComponent [authGuard]
/user/callback             → CallbackComponent
/user/login-redirect       → AppLoginComponent
/user/signup               → TemporaryAppSignupComponent  ← TEMPORARY (progress.com migration)
/user/onboarding           → OnboardingComponent
/**                        → PageNotFoundComponent
```

---

## Core Module (`AppModule`)

Configures: `RouterModule.forRoot`, `STFConfigModule.forRoot(environment)`, `TranslateModule.forRoot` with `MultiTranslateHttpLoader` (merges `user` + `common` + `sync` i18n files), `AngularSvgIconModule`, `PaToastModule`.

Only four app-level source files exist outside this module: `AppComponent`, `AppRoutingModule`, `AppTitleStrategy`, `LazyUserModule`. Everything else comes from libs.

Auth-related paths (`/user/callback`, `/user/login-redirect`, `/user/signup`, `/user/onboarding`, `/user/profile`) are declared as flat top-level routes — there is no `LazyUserModule` wrapper in this app. The `LazyUserModule` file exists but is not used in routing.

---

## Key Services

### `SDKService` (`@flaps/core`)

Central state + API gateway. Key observables:
`currentArag`, `currentKb`, `aragList`, `aragListWithMemory`, `aragListNoMemory`, `kbList`, `hasAccount`, `refreshingAragList`

### `FeaturesService` (`@flaps/core`)

Feature flags used in rao:

- `unstable.retrievalAgents` — gates entire ARAG section (`setAgentGuard`)
- `isAragAdmin` — admin-only workflow toolbar items
- `isAragWithMemory` — memory-related UI

### `WorkflowService` (`@flaps/common`)

Dynamically creates node form components via `createComponent()` + `ApplicationRef.attachView()`. Sidebar panels are rendered this way — **no `@if`/`*ngIf` template slots exist** for sidebar content.

### `NavigationService` (`@flaps/core`)

`goToLandingPage()`, `homeUrl` observable, `getAccountUrl(slug)`.

---

## Guards Summary

| Guard                | Source          | Purpose                                                                                                                            |
| -------------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `authGuard`          | `@flaps/core`   | Checks `JWT_KEY` in `localStorage`. Redirects to `/user/login` + saves intended URL.                                               |
| `rootGuard`          | `@flaps/common` | Calls `NavigationService.goToLandingPage()`. Always returns `false`.                                                               |
| `setAccountGuard`    | `@flaps/common` | Sets `SDKService` current account from `:account` slug.                                                                            |
| `setAgentGuard`      | `@flaps/common` | Requires `FeaturesService.unstable.retrievalAgents`. Loads ARAG list for zone. Redirects to `/select` if missing or flag disabled. |
| `selectAccountGuard` | `@flaps/common` | No accounts → onboarding; 1 → skip; multiple → selection page.                                                                     |
| `selectKbGuard`      | `@flaps/common` | Loads KB + ARAG lists; routes based on count.                                                                                      |
| `aragOwnerGuard`     | `@flaps/common` | Requires owner/admin ARAG role.                                                                                                    |
| `awsGuard`           | `@flaps/common` | Exchanges `customer_token` query param for `AuthTokens`.                                                                           |
| `inviteGuard`        | `@nuclia/user`  | Validates invite token from query string.                                                                                          |

---

## SCSS Design System

```scss
// _variables.scss
@forward '../../../libs/sistema/styles/variables';

// styles.scss
@use '../../../libs/sistema/styles/apps-common';
@use '../../../libs/pastanaga-angular/.../styles/core';
```

Component stylesheets use `@use 'variables'` (resolved via `stylePreprocessorOptions.includePaths: ['apps/rao/src']`).

ARAG-specific tokens are in `libs/common/src/lib/retrieval-agent/agent-dashboard/_agent-dashboard.tokens.scss`:
`$height-toolbar`, `$height-main`, `$width-sidebar`, `$width-sidebar-large`, `$padding-sidebar`

---

## Runtime Configuration

`assets/deployment/app-config.json` loaded at startup from `environments_config/{config}/`.

| Serve config            | Backend                                   |
| ----------------------- | ----------------------------------------- |
| `local-stage` (default) | Nuclia stage server                       |
| `local-prod`            | `https://rag.progress.cloud`              |
| `production`            | Docker `STF_DOCKER_CONFIG_*` placeholders |

---

## Angular Service Worker (PWA)

Enabled in production only. Strategy: `freshness` for API (no caching), `prefetchesAll` for app shell.

---

## Running Locally

```sh
nx serve rao           # against Nuclia stage (default)
nx serve rao -c local-prod  # against rag.progress.cloud
nx build rao           # production build → dist/apps/rao
nx test rao
```

---

## Important Conventions

1. **ARAG-only** — no KB management routes. ARAG features belong in `libs/common` (shared with dashboard).
2. **Signal-based workflow state** — mutations go through exported state functions in `workflow.state.ts` (`addNode()`, `deleteNode()`, `updateNode()`). Never mutate signals directly from outside the state file.
3. **Dynamic sidebar** — `WorkflowService.openSidebar()` uses `createComponent()`. No template slots for sidebar content.
4. **Module-based** — app uses NgModules. Individual lib components may be standalone.
5. **i18n order** — translations merged: `user` → `common` → `sync`. Later keys override earlier.
6. **UI ↔ API models** — use `*AgentToUi()` (API → UI) and `*UiToCreation()` (UI → API) from `workflow.models.ts`.
7. **Lazy loading** — `AccountModule`, `WIDGETS_ROUTES`, `LazyUserModule` are all lazy.
8. **SCSS tokens** — always use `@use 'variables'`. Never hard-code colors/spacing/fonts.
9. **Feature flags** — ARAG availability gated by `FeaturesService.unstable.retrievalAgents`.
10. **`setAgentGuard`** — guards the entire ARAG section. If the feature flag is off, the guard redirects to `/select`.
11. **ARAG root redirects to `/workflows`** — `/:zone/arag/:agent/` redirects to `./workflows` where `WorkflowsListComponent` lists all workflows. Individual workflow canvas is at `./workflows/:id`. ARAG also exposes `/search`, `/activity`, `/sessions` (with nested edit view), `/drivers`, `/widgets`, `/manage`, `/ai-models`, `/users`, `/keys`.
