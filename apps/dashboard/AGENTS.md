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
    /upload                → UploadModule (lazy)
    /resources             → ResourcesModule (lazy)
    /search                → SearchPageComponent
    /activity              → ActivityModule (lazy)
    /ai-models             → AiModelsComponent
    /widgets               → WIDGETS_ROUTES (lazy)
    /manage                → KnowledgeBoxSettingsComponent
    /rag-lab               → RagLabPageComponent
    /tasks                 → TASK_AUTOMATION_ROUTES (lazy)
    /metrics               → MetricsPageComponent (knowledgeBoxOwnerGuard)
    /users / /keys         → guarded by aragOwnerGuard
  /:zone/arag/:agent  [setAgentGuard]
    /                      → AgentDashboardComponent
    /sessions              → SessionsComponent
    /drivers               → DriversPageComponent
    /widgets / /manage / /ai-models / /users / /keys / /activity
/select  [authGuard, selectAccountGuard]
  /:account  [selectKbGuard] → SelectKbComponent
/user                      → LazyUserModule (login, logout, invite, farewell)
/feedback / /farewell / /invite / /aws-onboarding
/**                        → PageNotFoundComponent
```

---

## Core Modules

### `AppModule`
`STFConfigModule.forRoot(environment)`, `TranslateModule.forRoot(MultiTranslateHttpLoader)`, `BaseModule`, `PaToastModule`, `AuthInterceptor`, `TitleStrategy → AppTitleStrategy`.

### `KnowledgeBoxModule`
`KnowledgeBoxComponent` (thin router-outlet wrapper) + `KnowledgeBoxHomeComponent` (KB dashboard: usage charts, status counts, trial info, REMI metrics). Lazy-loaded heavy UI.

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

| Guard | Purpose |
|---|---|
| `authGuard` | Requires authenticated user (`JWT_KEY` in localStorage) |
| `rootGuard` | Redirects to first account/KB or login |
| `setAccountGuard` | Sets active account in SDK |
| `setKbGuard` | Sets active KB in SDK |
| `setAgentGuard` | Sets active ARAG in SDK |
| `selectAccountGuard` | Ensures account selection flow |
| `selectKbGuard` | Ensures KB selection flow |
| `knowledgeBoxOwnerGuard` | KB owner/admin required |
| `aragOwnerGuard` | ARAG owner/admin required |
| `awsGuard` | AWS Marketplace onboarding |
| `inviteGuard` | Validates invite token |

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
