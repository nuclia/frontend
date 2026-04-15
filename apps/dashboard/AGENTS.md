# Dashboard App — Agent Reference Guide

## Overview

`apps/dashboard` is the primary Angular (NgModule-based) frontend for Nuclia's ARAG platform. Lets users manage Knowledge Boxes (KBs) and Retrieval Agents (ARAGs), upload resources, monitor usage, configure AI models, and interact with Nuclia's search/RAG capabilities.

**Entry point:** `main.ts` → `AppModule` → `AppComponent`  
All ARAG workflow code lives in `libs/common` and is shared with `apps/rao`.

---

## Project Structure

```
apps/dashboard/src/app/
├── app.module.ts              # Root NgModule
├── app-routing.module.ts      # Top-level route definitions
├── app.component.ts           # Root (toast container, splash screen)
├── app-title.strategy.ts
├── lazy-user.module.ts        # Lazy @nuclia/user wrapper
├── knowledge-box/             # KB feature module + KnowledgeBoxHomeComponent
│   └── knowledge-box-home/    # UsageChartsComponent, UsageModalComponent
├── activity/                  # ActivityDownloadComponent, LogTableComponent, ActivityService
├── onboarding/                # GettingStartedComponent, WelcomeInExistingKBComponent
└── synonyms/                  # SynonymsComponent, SynonymsService
```

---

## Routing Architecture

```
/  [rootGuard]             → EmptyComponent (redirects based on auth)
/redirect                  → RedirectComponent

/at/:account  [setAccountGuard]
  /manage                  → AccountModule (lazy) — billing, users, ARAGs list
  /:zone/:kb  [setKbGuard]
    /                      → KnowledgeBoxHomeComponent
    /simple                → SimpleKBComponent  ← frictionless UI (simpleUI feature flag)
    /upload                → UploadModule (lazy)
    /resources             → ResourcesModule (lazy)
    /search                → SearchPageComponent
    /sync                  → SYNC_ROUTES (lazy)
    /activity              [canMatch: metricsDisabledGuard] → ActivityModule (lazy)
    /entities              → EntitiesModule (lazy)
    /label-sets            → LabelSetsModule (lazy)
    /synonyms              → SynonymsModule (lazy)
    /ai-models             [knowledgeBoxOwnerGuard] → AiModelsComponent
    /widgets               [knowledgeBoxOwnerGuard] → WIDGETS_ROUTES (lazy)
    /manage                [knowledgeBoxOwnerGuard] → KnowledgeBoxSettingsComponent
    /users                 [knowledgeBoxOwnerGuard] → KnowledgeBoxUsersComponent
    /keys                  [knowledgeBoxOwnerGuard] → KnowledgeBoxKeysComponent
    /rag-lab               → RagLabPageComponent
    /prompt-lab            → redirectTo: 'rag-lab'
    /tasks                 → TASK_AUTOMATION_ROUTES (lazy)
    /metrics               [canMatch: metricsDisabledGuard, knowledgeBoxOwnerGuard] → LegacyRemiMetricsPageComponent
    /metrics               [canMatch: metricsEnabledGuard, knowledgeBoxOwnerGuard]  → MetricsModule (lazy)
  /:zone/arag/:agent  [setAgentGuard]
    /                      → redirect to /workflows
    /workflows             → WorkflowsComponent
      /                    → WorkflowsListComponent
      /:id                 → AgentDashboardComponent
    /sessions              → SessionsComponent
      /                    → SessionsListComponent
      /:id/edit            → EditResourceComponent (data: { mode: 'arag' })
    /drivers               → DriversPageComponent
    /search                → SearchPageComponent
    /widgets               [aragOwnerGuard] → WIDGETS_ROUTES (lazy)
    /manage                [aragOwnerGuard] → KnowledgeBoxSettingsComponent
    /users                 [aragOwnerGuard] → KnowledgeBoxUsersComponent
    /keys                  [aragOwnerGuard] → KnowledgeBoxKeysComponent
    /activity              → AgentActivityComponent
/select  [authGuard, selectAccountGuard]
  /:account  [selectKbGuard] → SelectKbComponent
/user                      → LazyUserModule (login, logout, invite, farewell)
/user/callbacks/saml       → CallbackComponent (data: { saml: true }) ← TEMPORARY IDP-initiated SAML
/user/set-password         → SetPasswordComponent
/user/login                → redirectTo: '' (backwards compat)
/feedback / /farewell / /invite / /aws-onboarding
/**                        → PageNotFoundComponent
```

---

## Core Modules

### `AppModule`

`STFConfigModule.forRoot(environment)`, `TranslateModule.forRoot(MultiTranslateHttpLoader)`, `BaseModule`, `PaToastModule`, `AuthInterceptor`, `TitleStrategy → AppTitleStrategy`.

### `KnowledgeBoxModule`

`KnowledgeBoxComponent` (thin router-outlet wrapper) + `KnowledgeBoxHomeComponent` (KB dashboard: usage charts, status counts, trial info, REMI metrics) + `SimpleKBComponent` (frictionless upload-and-search UI, gated by `unstable.simpleUI` feature flag, shown at `/simple`). Lazy-loaded heavy UI.

### `ActivityModule`

`ActivityDownloadComponent` (tabs: Resource / Search activity, date pickers, CSV/JSON download), `LogTableComponent`, `ActivityService` (polls backend for `DownloadStatus: 'pending' | 'ready'`).

---

## Knowledge Box Home

`KnowledgeBoxHomeComponent` shows: KB endpoint URL, UID, region, status badge, 4 usage charts (Processing/Search/Ask/Nuclia Tokens), REMI metrics (if `authorized.remiMetrics`), resource status counts, trial info.

---

## ARAG Dashboard (in `libs/common`)

`AgentDashboardComponent` is the ARAG workflow editor — shared with `apps/rao`.

**`WorkflowService`** orchestrates the canvas:

- Dynamically creates node form components via `createComponent()` + `ApplicationRef.attachView()`.
- Sidebar panels (rules, add-node, test, import, export) are rendered this way — **no `@if`/`*ngIf` template slots for sidebar content**.
- `openSidebar(type, component)` — renders any component into the sidebar.

**Workflow state** — Angular signals (no NgRx), in `workflow.state.ts`:
`aragUrl`, `sidebar`, `selectedNode`, `preprocessNodes`, `contextNodes`, `generationNodes`, `postprocessNodes`, `childNodes`, `workflow`, `testAgent`

---

## Guards Summary

| Guard                    | Purpose                                                          |
| ------------------------ | ---------------------------------------------------------------- |
| `authGuard`              | Requires authenticated user (`JWT_KEY` in localStorage)          |
| `rootGuard`              | Redirects to first account/KB or login                           |
| `setAccountGuard`        | Sets active account in SDK                                       |
| `setKbGuard`             | Sets active KB in SDK                                            |
| `setAgentGuard`          | Sets active ARAG in SDK                                          |
| `selectAccountGuard`     | Ensures account selection flow                                   |
| `selectKbGuard`          | Ensures KB selection flow                                        |
| `knowledgeBoxOwnerGuard` | KB owner/admin required                                          |
| `aragOwnerGuard`         | ARAG owner/admin required                                        |
| `awsGuard`               | AWS Marketplace onboarding                                       |
| `inviteGuard`            | Validates invite token                                           |
| `metricsEnabledGuard`    | `canMatch` — true when `FeaturesService.unstable.metrics` is on  |
| `metricsDisabledGuard`   | `canMatch` — true when `FeaturesService.unstable.metrics` is off |

---

## SCSS

```scss
// Components use:
@use 'apps/dashboard/src/variables' as *;
// Exposes: colors, rhythm(), font-size(), title-*() mixins, font weights
```

ARAG tokens in `libs/common/src/lib/retrieval-agent/agent-dashboard/_agent-dashboard.tokens.scss`:
`$height-toolbar`, `$height-main`, `$width-sidebar`, `$width-sidebar-large`, `$padding-sidebar`

---

## Running Locally

```sh
nx serve dashboard           # against Nuclia stage (default)
nx serve dashboard -c local-prod  # against production
nx build dashboard
nx test dashboard
```

Config: `src/environments_config/{local-stage,local-prod,production}/app-config.json`

---

## Important Conventions

1. **Signal-based workflow state** — mutations via exported state functions in `workflow.state.ts` (`addNode()`, `deleteNode()`, `updateNode()`). Never mutate signals from outside the state file.
2. **Dynamic sidebar** — `WorkflowService.openSidebar()` uses `createComponent()`. No template slots.
3. **Shared ARAG code** — `AgentDashboardComponent` + all workflow code in `libs/common`. Dashboard-specific code: `app/` directory only.
4. **Module-based** — app uses NgModules; imported lib components may be standalone.
5. **UI ↔ API models** — `*AgentToUi()` (API → UI) and `*UiToCreation()` (UI → API) in `workflow.models.ts`.
6. **Lazy modules** — `AccountModule`, `UploadModule`, `ResourcesModule`, `ActivityModule`, `WIDGETS_ROUTES`, `TASK_AUTOMATION_ROUTES`, `LazyUserModule` are all lazy-loaded.
7. **Metrics route is feature-flag-split** — `/metrics` has two `canMatch` entries: `metricsDisabledGuard` → `LegacyRemiMetricsPageComponent`, `metricsEnabledGuard` → `MetricsModule` (lazy). Angular evaluates them in order; only one renders.
8. **`/activity` is also gated by `metricsDisabledGuard`** — when the `metrics` flag is on, activity is handled inside `MetricsModule`; the standalone `ActivityModule` route is disabled.
9. **`/user/callbacks/saml` is temporary** — added for IDP-initiated SAML clients whose `RelayState` points here. Remove once those clients are updated to use the auth app's URL.
10. **`/simple` frictionless UI** — `SimpleKBComponent` is a lightweight upload+search page gated by `FeaturesService.unstable.simpleUI`. It uses `LastResourcesComponent` (standalone) for the resource table.
11. **ARAG routes now under `/workflows`** — `/:zone/arag/:agent` redirects to `./workflows`. `WorkflowsListComponent` shows all workflows; `AgentDashboardComponent` is at `./workflows/:id`.
12. **`/user/set-password`** — `SetPasswordComponent` is a dedicated route for setting a password after being invited or after signup. Distinct from `/user/reset` (which uses a magic token from an email link).
13. **KB routes guarded by `knowledgeBoxOwnerGuard`** — `/manage`, `/ai-models`, `/widgets`, `/users`, `/keys` under `/:zone/:kb` all require `knowledgeBoxOwnerGuard` (KB owner/admin). ARAG equivalents use `aragOwnerGuard`.
14. **`/prompt-lab` redirect** — permanently redirects to `/rag-lab`. Old bookmarks continue to work.
