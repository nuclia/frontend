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
├── app-routing.module.ts      # Top-level route definitions (routes to @nuclia/user components declared directly, no wrapper module)
├── app-routing.lazy.ts        # Re-exports for all lazy-loaded modules/routes (single dynamic import surface)
├── app.component.ts           # Root (toast container, splash screen, global chat-advice bubble)
├── app-title.strategy.ts
└── knowledge-box/             # KB feature module + KnowledgeBoxHomeComponent
    ├── knowledge-box-home/    # kb-header/, kb-onboarding/ (KbOnboardingHeaderComponent), kb-more-actions/
    │                          # (settings/developer-integrations/test-page menu), developer-integrations-modal/,
    │                          # kb-usage/ (UsageChartsComponent), last-resources/ — composed into KnowledgeBoxHomeComponent
    └── simple/                # SimplePageModule (lazy) — "Context Box" frictionless UI
        ├── simple-page.component.ts   # Routes to ReaderExperienceComponent (reader) or SimpleKBComponent (admin/contrib);
        │                               # also shows TrialExpiredModalComponent (non-dismissable) if the account trial expired
        ├── simple-kb/                 # SimpleKBComponent + SimpleKBService — upload + search for admins/contributors
        ├── reader-experience/         # ReaderExperienceComponent — search-only view for readers
        ├── history-table/, resource-table/  # tables rendered inside SimpleKBComponent
        └── mcp-endpoint/              # McpEndpointModalComponent — MCP server connection details modal
```

`apps/dashboard/src/app` only has one top-level feature folder (`knowledge-box/`) — everything else (accounts, resources, entities, label-sets, settings, ARAG workflows, onboarding wizard) lives in `libs/common` and is lazy-loaded via `app-routing.lazy.ts`. The old app-local `onboarding/` folder (`GettingStartedComponent`, `WelcomeInExistingKBComponent`) was removed when KB onboarding was rebuilt as `KbOnboardingHeaderComponent` (see Knowledge Box Home below); a separate, unrelated `OnboardingComponent` (account/KB creation wizard) lives in `libs/common` and is routed at `/user/onboarding`.

---

## Routing Architecture

```
/  [rootGuard]             → EmptyComponent (redirects based on auth)
/redirect                  → RedirectComponent

/at/:account  [setAccountGuard]           ← also sets NavigationService.simpleMode = (account.workflow === 'cowork')
  /manage                  → AccountModule (lazy) — billing, users, ARAGs list
  /:zone/:kb  [setKbGuard]
    /                      [simpleModeGuard] → KnowledgeBoxHomeComponent (redirects to ./simple when simpleMode is true)
    /simple                → SimplePageModule (lazy) → SimplePageComponent
                             ├─ reader role  → ReaderExperienceComponent
                             └─ admin/contrib → SimpleKBComponent
    /upload                → UploadModule (lazy)
    /resources             → ResourcesModule (lazy)
    /search                → SearchPageComponent
    /sync                  → SYNC_ROUTES (lazy)
    /entities              → EntitiesModule (lazy)
    /label-sets            → LabelSetsModule (lazy)
    /ai-models             [knowledgeBoxOwnerGuard] → AiModelsComponent
    /widgets               [knowledgeBoxOwnerGuard] → WIDGETS_ROUTES (lazy)
    /manage                [knowledgeBoxOwnerGuard] → KbSettingsModule (lazy)
                             ├─ general             → KnowledgeBoxSettingsComponent
                             └─ kv-schemas          → KvSchemasComponent
    /users                 [knowledgeBoxOwnerGuard, canDeactivate: inviteInProgressGuard] → KnowledgeBoxUsersComponent
    /keys                  [knowledgeBoxOwnerGuard] → KnowledgeBoxKeysComponent
    /rag-lab               → RagLabPageComponent
    /prompt-lab            → redirectTo: 'rag-lab'
    /tasks                 → TASK_AUTOMATION_ROUTES (lazy)
    /metrics               [knowledgeBoxOwnerGuard] → MetricsModule (lazy)
      /detailed            → ActivityModule (lazy) ← "Detailed logs" CSV/NDJSON download
  /:zone/arag/:agent  [setAgentGuard]
    /                      → redirect to /workflows
    /workflows             → WorkflowsComponent
      /                    → WorkflowsListComponent
      /:id                 → AgentDashboardComponent
    /sessions              → SessionsComponent
      /                    → SessionsListComponent
      /:id/edit            → EditResourceComponent (data: { mode: 'arag' })
    /sources               → DriversPageComponent
    /search                → SearchPageComponent
    /widgets               [aragOwnerGuard] → WIDGETS_ROUTES (lazy)
    /manage                [aragOwnerGuard] → KnowledgeBoxSettingsComponent
    /users                 [aragOwnerGuard, canDeactivate: inviteInProgressGuard] → KnowledgeBoxUsersComponent
    /keys                  [aragOwnerGuard] → KnowledgeBoxKeysComponent
    /activity              → AgentActivityComponent
/select  [authGuard, selectAccountGuard]
  /:account  [selectKbGuard] → SelectKbComponent
/feedback  [authGuard] / /farewell / /setup_account  [awsGuard] (AwsOnboardingComponent)
/user/profile               → ProfileComponent (`libs/common`) [authGuard]
/user/callback               → CallbackComponent
/user/callbacks/saml         → CallbackComponent (data: { saml: true }) ← TEMPORARY IDP-initiated SAML
/user/login-redirect         → AppLoginComponent (starts the OAuth flow)
/user/signup    [redirectToSignUp] → PageNotFoundComponent — guard hard-redirects to the external progress.com sign-up page and returns false, so this component never renders
/user/test-signup            → TestingAppSignupComponent
/user/contextbox-signup      → TemporaryContextBoxSignupComponent — signup for "Context Box" (cowork) accounts
/user/onboarding              → OnboardingComponent (KB/account creation wizard)
/user/set-password            → SetPasswordComponent
/user/login                   → redirectTo: '' (backwards compat)
/**                           → PageNotFoundComponent
```

**Note:** all `/user/*` components above are imported directly from `@nuclia/user`/`@flaps/common` into `app-routing.module.ts` — there is no `LazyUserModule` wrapper (removed). See `libs/user/AGENTS.md` for what each component does; this file is the source of truth for their exact paths in `dashboard`.

---

## Core Modules

### `AppModule`

`STFConfigModule.forRoot(environment)`, `TranslateModule.forRoot(MultiTranslateHttpLoader)`, `BaseModule`, `PaToastModule`, `TitleStrategy → AppTitleStrategy`. Also declares `ChatAdviceBubbleComponent` globally in `AppComponent`'s template, shown when `features.unstable.chatAdvice` is enabled.

**No auth HTTP interceptor** — `provideHttpClient(withInterceptorsFromDi())` is configured but nothing provides `HTTP_INTERCEPTORS`; auth headers are attached by the SDK itself, not by an Angular interceptor (removed in #2680, "Angular interceptor is never used since we use the SDK to fetch"). Don't assume one exists when debugging auth headers on HTTP calls.

### `KnowledgeBoxModule`

`KnowledgeBoxComponent` (thin router-outlet wrapper) + `KnowledgeBoxHomeComponent` (KB dashboard). `SimplePageModule` is a separately lazy-loaded route at `/simple` (not part of `KnowledgeBoxModule`'s own imports) — gated by whether the current account's `workflow === 'cowork'` (a "Context Box" account), not by a feature flag. `SimplePageComponent` (inside `SimplePageModule`) routes to `ReaderExperienceComponent` for read-only KB users or `SimpleKBComponent` for admins/contributors.

---

## Knowledge Box Home

`KnowledgeBoxHomeComponent` composes several sub-components: `KbOnboardingHeaderComponent` (admin-only, wraps `KbHeaderComponent` once onboarding is done — KB name, storage summary popup, search/upload buttons, `KbMoreActionsComponent` "more actions" menu shared between both headers for KB settings / `DeveloperIntegrationsModalComponent` / test page), a KB summary grid (region, generative model, status, semantic model), account-manager-only usage charts + a usage summary table, a health-status card (REMI, shown when `isKBContrib` and `authorized.remiMetrics`, "more metrics" link goes to `/metrics/remi-analytics`), and `LastResourcesComponent` (recent resources preview). The `app-account-status` trial banner (`isAccountManager && isTrial`) was removed from this page.

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

| Guard                    | Purpose                                                                                                   |
| ------------------------ | --------------------------------------------------------------------------------------------------------- |
| `authGuard`              | Requires authenticated user (`JWT_KEY` in localStorage)                                                   |
| `rootGuard`              | Redirects to first account/KB or login                                                                    |
| `setAccountGuard`        | Sets active account in SDK; also sets `NavigationService.simpleMode` from `account.workflow === 'cowork'` |
| `setKbGuard`             | Sets active KB in SDK                                                                                     |
| `setAgentGuard`          | Sets active ARAG in SDK                                                                                   |
| `selectAccountGuard`     | Ensures account selection flow                                                                            |
| `selectKbGuard`          | Ensures KB selection flow                                                                                 |
| `knowledgeBoxOwnerGuard` | KB owner/admin required                                                                                   |
| `aragOwnerGuard`         | ARAG owner/admin required                                                                                 |
| `awsGuard`               | AWS Marketplace onboarding                                                                                |
| `redirectToSignUp`       | On `/user/signup`: always redirects to the external marketing sign-up page and blocks activation          |
| `inviteInProgressGuard`  | `canDeactivate` on `/users`: confirms navigation away while a multi-user invite is in progress            |
| `simpleModeGuard`        | On KB home (`/`): redirects to `/simple` when `NavigationService.simpleMode` is true                      |

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
6. **Lazy modules** — `AccountModule`, `EntitiesModule`, `KbSettingsModule`, `MetricsModule` (+ `ActivityModule` inside it), `ResourcesModule`, `TASK_AUTOMATION_ROUTES`, `UploadModule`, `WIDGETS_ROUTES`, `SimplePageModule`, `LabelSetsModule` — all re-exported from `app-routing.lazy.ts` and dynamically imported from `app-routing.module.ts`. `/user/*` routes are **not** lazy — their components are imported directly into `app-routing.module.ts` (no wrapper module).
7. **`/metrics` always loads `MetricsModule`** — the legacy REMI-only page and the `metricsDisabledGuard`/`metricsEnabledGuard` split were removed. `MetricsModule` is always loaded when the `/metrics` route is activated.
8. **Activity logs moved to `/metrics/detailed`** — `ActivityModule` (`libs/common/src/lib/metrics/activity/`) is lazy-loaded inside `MetricsModule` at the `detailed` child route. There is no longer a standalone `/activity` route on the KB.
9. **`/user/callbacks/saml` is temporary** — added for IDP-initiated SAML clients whose `RelayState` points here. Remove once those clients are updated to use the auth app's URL.
10. **`/simple` "Context Box" UI** — `SimplePageModule` is lazy-loaded; `SimplePageComponent` inspects the user role and routes to `ReaderExperienceComponent` (reader: search-only) or `SimpleKBComponent` (admin/contrib: upload + search). Gated by `account.workflow === 'cowork'`, not a feature flag — see `setAccountGuard`. `SimplePageComponent` also blocks the page with a non-dismissable `TrialExpiredModalComponent` when the account's trial has expired.
11. **Context Box uploads keyed by batch, not global state** — `SimpleKBService.uploadStatus` is a map of `{ [uploadIndex]: UploadStatus }` (one entry per `uploadFiles()` call), not a single status object. This is what makes concurrent/simultaneous upload batches possible (#2996) without one batch's progress overwriting another's; `cleanUploads()` prunes completed entries on each new upload to avoid unbounded growth. `visibleUploads` flattens all batches' files for display.
12. **Media-file-blocked sentinel** — in `SimpleKBComponent.onFilesSelected()`, `maxMediaFileSize === 1` (from `account.limits.upload.upload_limit_max_media_file_size`) means "media files are not supported at all" for this account/plan, not a literal 1-byte limit — it drives the `simple.no-media-files` toast instead of the size-limit toast (#2995). Don't treat `1` as a real byte limit when touching this logic.
13. **ARAG routes now under `/workflows`** — `/:zone/arag/:agent` redirects to `./workflows`. `WorkflowsListComponent` shows all workflows; `AgentDashboardComponent` is at `./workflows/:id`.
14. **`/user/set-password`** — `SetPasswordComponent` is a dedicated route for setting a password after being invited or after signup. Distinct from `/user/reset` (which uses a magic token from an email link).
15. **KB routes guarded by `knowledgeBoxOwnerGuard`** — `/manage`, `/ai-models`, `/widgets`, `/users`, `/keys` under `/:zone/:kb` all require `knowledgeBoxOwnerGuard` (KB owner/admin). ARAG equivalents use `aragOwnerGuard`. `/users` also has `canDeactivate: [inviteInProgressGuard]` on both.
16. **`/prompt-lab` redirect** — permanently redirects to `/rag-lab`. Old bookmarks continue to work.
17. **ARAG `/sources` route** — previously named `/drivers`, renamed to `/sources`. `DriversPageComponent` (name unchanged) renders data sources.
