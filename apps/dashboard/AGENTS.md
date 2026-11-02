# Dashboard App — Agent Reference Guide

## Overview

`apps/dashboard` is the primary Angular frontend for Nuclia's ARAG platform, built with standalone components. Lets users manage Knowledge Boxes (KBs) and Retrieval Agents (ARAGs), upload resources, monitor usage, configure AI models, and interact with Nuclia's search/RAG capabilities.

**Entry point:** `main.ts` (`bootstrapApplication(AppComponent, …)`) — zoneless (`provideZonelessChangeDetection()`); legacy providers/lazy route groupings are still pulled in via `importProvidersFrom()`. Translations come from `provideTranslateService({ loader: provideTranslateHttpLoader(…) })` loading `assets/i18n/{user,common,sync}/<lang>.json`; there is no `TranslateModule.forRoot` and no `BrowserAnimationsModule`.  
All ARAG workflow code lives in `libs/common` and is shared with `apps/rao`.

---

## Project Structure

```
apps/dashboard/src/app/
├── app-routing.module.ts      # Top-level route definitions as a legacy NgModule wrapper (routes to @nuclia/user components declared directly, no wrapper module)
├── app-routing.lazy.ts        # Re-exports for all lazy-loaded modules/routes (single dynamic import surface)
├── app.component.ts           # Root (toast container, splash screen, global chat-advice bubble)
├── app-title.strategy.ts
└── knowledge-box/             # KB feature module + KnowledgeBoxHomeComponent
    ├── knowledge-box-home/    # kb-header/, kb-onboarding/ (KbOnboardingHeaderComponent), kb-more-actions/
    │                          # (settings/developer-integrations/test-page menu, used by KbHeaderComponent),
    │                          # developer-integrations-modal/, test-page-modal/, kb-usage/ (UsageChartsComponent),
    │                          # last-resources/ — composed into KnowledgeBoxHomeComponent
    └── context-box/           # ContextBoxPageModule (lazy, URL `/simple`) — "Context Box" frictionless UI
        ├── context-box-page.component.ts  # Routes to ReaderExperienceComponent (reader) or ContextBoxComponent (admin/contrib);
        │                                   # also blocks with a payment redirect or TrialExpiredModalComponent (see convention 10)
        ├── context-box-page-routing.module.ts  # '' and ':externalConnectionId' both render ContextBoxPageComponent
        ├── context-box/               # ContextBoxComponent + ContextBoxService (uploads) + ContextBoxShareFileService
        │                              # (ShareFile sync connector) — upload, ShareFile and search for admins/contributors
        ├── reader-experience/         # ReaderExperienceComponent — search-only view for readers
        ├── history-table/, resource-table/  # tables (with modal variants) rendered inside ContextBoxComponent
        ├── trial-expired-modal/       # non-dismissable TrialExpiredModalComponent; `context-box.utils.ts` has isTrialExpired()
        └── mcp-endpoint/              # McpEndpointModalComponent — MCP server connection details modal
```

`apps/dashboard/src/app` only has one top-level feature folder (`knowledge-box/`) — everything else (accounts, resources, data page, entities, label-sets, settings, ARAG workflows, onboarding wizard) lives in `libs/common` and is lazy-loaded via `app-routing.lazy.ts`. A separate `OnboardingComponent` (account/KB creation wizard) lives in `libs/common` and is routed at `/user/onboarding`; KB-level onboarding is `KbOnboardingHeaderComponent` (see Knowledge Box Home below).

---

## Routing Architecture

```
/  [rootGuard]             → EmptyComponent (redirects based on auth)
/redirect                  → RedirectComponent

/at/:account  [setAccountGuard]           ← also calls NavigationService.setContextBoxMode(account.workflow === 'cowork')
  /                        → redirectTo 'manage'
  /manage/**               → [redirectToAdminGuard] EmptyComponent — never renders; guard does a real
                               (cross-origin) redirect to the standalone `admin` app's account-management
                               pages (billing, users, ARAGs list), preserving the sub-path and query params
  /:zone/:kb  [setKbGuard]
    /                      [contextBoxModeGuard] → KnowledgeBoxHomeComponent (redirects to ./simple when contextBoxMode is true)
    /simple                → ContextBoxPageModule (lazy) → ContextBoxPageComponent
                             ├─ reader role  → ReaderExperienceComponent
                             └─ admin/contrib → ContextBoxComponent
    /data                  → DATA_ROUTES (lazy) → DataPageComponent tab shell (default child: resources)
      ├─ /resources        → RESOURCE_ROUTES (resource list, upload actions, resource editor)
      └─ /sync             → SYNC_ROUTES: '' SynchronizeComponent, 'connect' ConnectComponent (Connect tab only when
                             `FeaturesService.unstable.agenticSearch` is on), plus add/:connector, :syncId, add-source/:type
    /search                → SearchPageComponent
    /search/:widgetSlug    → SearchPageComponent (preselects that saved widget: `initialWidgetSlug`)
    /widgets, /widgets/:slug → redirectTo 'search', 'search/:slug' (KB-level widget routes are redirects)
    /entities              → EntitiesModule (lazy)
    /label-sets            → LabelSetsModule (lazy)
    /ai-models             [knowledgeBoxOwnerGuard] → AiModelsComponent
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
    /                      [redirectToWorkflowGuard] → redirects to /workflows/:id of the last-used workflow (else `default`)
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
/user/onboarding              → OnboardingComponent (KB/account creation wizard)
/**                           → PageNotFoundComponent
```

**Note:** all `/user/*` components above are imported directly from `@nuclia/user`/`@flaps/common` into `app-routing.module.ts` (no lazy wrapper module). Signup/set-password routes (`/user/test-signup`, `/user/contextbox-signup`, `/user/set-password`) are served by `apps/admin`, not here. See `libs/user/AGENTS.md` for what each component does.

---

## Core Modules

### Bootstrap providers (`main.ts`)

There is no `AppModule`. `main.ts` provides `STFConfigModule.forRoot(environment)`, `BaseModule`, `PaToastModule`, `provideTranslateService(…)`, `TitleStrategy → AppTitleStrategy`. `AppComponent`'s template renders `<stf-chat-advice-bubble>` (`ChatAdviceBubbleComponent`) when `features.unstable.chatAdvice` is enabled.

**No auth HTTP interceptor** — `provideHttpClient(withInterceptorsFromDi())` is configured but nothing provides `HTTP_INTERCEPTORS`; auth headers are attached by the SDK itself, not by an Angular interceptor. Don't assume one exists when debugging auth headers on HTTP calls.

`KnowledgeBoxModule` only wraps `KnowledgeBoxComponent` (router-outlet shell) + `KnowledgeBoxHomeComponent`; `/simple` (`ContextBoxPageModule`) is a separate lazy route (convention 10).

---

## Knowledge Box Home

`KnowledgeBoxHomeComponent` composes: `KbOnboardingHeaderComponent` (admin-only; renders the step cards — upload via `<stf-upload-button>` from `@flaps/common`, "Try search" calls `markDone` — and embeds `KbHeaderComponent` once onboarding is done), `KbHeaderComponent` (KB name, storage summary popup, search/upload buttons, and the only `KbMoreActionsComponent` "more actions" menu: KB settings / `DeveloperIntegrationsModalComponent` / test page), a KB summary grid (region, generative model, status, semantic model), account-manager-only usage charts + a usage summary table, a health-status card (REMI, shown when `isKBContrib` and `authorized.remiMetrics`, "more metrics" link goes to `/metrics/remi-analytics`), and `LastResourcesComponent` (recent resources preview). Resource-list/search links come from `NavigationService.getResourceListUrl()` / `getSearchUrl()` (both return Observables and resolve to `/data/resources` and `/search`).

Build KB URLs through `NavigationService.getKbUrl(account.slug, kb.slug)` rather than assembling the route locally.

---

## ARAG Dashboard (in `libs/common`)

`AgentDashboardComponent` is the ARAG workflow editor — shared with `apps/rao`.

**`WorkflowService`** creates node form components and sidebar panels dynamically (`createComponent()` + `ApplicationRef.attachView()`, `openSidebar(type, component)`) — there are no `@if`/`*ngIf` template slots for sidebar content. Workflow state is Angular signals (no NgRx) in `workflow.state.ts`.

---

## Guards Summary

| Guard                     | Purpose                                                                                                                                                               |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `authGuard`               | Requires authenticated user (`JWT_KEY` in localStorage)                                                                                                               |
| `rootGuard`               | Redirects to first account/KB or login                                                                                                                                |
| `setAccountGuard`         | Sets active account in SDK; also calls `NavigationService.setContextBoxMode(account.workflow === 'cowork')`                                                           |
| `setKbGuard`              | Sets active KB in SDK                                                                                                                                                 |
| `setAgentGuard`           | Sets active ARAG in SDK                                                                                                                                               |
| `selectAccountGuard`      | On `/select`: no accounts → onboarding (if user can create) or logout; exactly one account → redirects to `/select/:slug` (skips account picker); several → picker    |
| `selectKbGuard`           | Ensures KB selection flow                                                                                                                                             |
| `knowledgeBoxOwnerGuard`  | KB owner/admin required                                                                                                                                               |
| `aragOwnerGuard`          | ARAG owner/admin required                                                                                                                                             |
| `awsGuard`                | AWS Marketplace onboarding                                                                                                                                            |
| `redirectToAdminGuard`    | On `/manage`: redirects (same-origin route or cross-origin, via `NavigationService.resolveGuardRedirect()`) to the standalone `admin` app's account-management pages. |
| `redirectToSignUp`        | On `/user/signup`: always redirects to the external marketing sign-up page and blocks activation                                                                      |
| `inviteInProgressGuard`   | `canDeactivate` on `/users`: confirms navigation away while a multi-user invite is in progress                                                                        |
| `contextBoxModeGuard`     | On KB home (`/`): redirects to `/simple` when `NavigationService.contextBoxMode` is true                                                                              |
| `redirectToWorkflowGuard` | On the bare ARAG entry: redirects to the last-used workflow canvas (else `default`); explicit `/workflows` still shows the list                                       |

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
4. **Standalone by default** — components, directives and pipes are standalone without a `standalone: true` flag (Angular 22 default); don't add it. The `@NgModule`s that exist (`KnowledgeBoxModule`, `ContextBoxPageModule`, `ContextBoxPageRoutingModule`, `AppRoutingModule`) are route-grouping/import wrappers and declare no components.
5. **UI ↔ API models** — `*AgentToUi()` (API → UI) and `*UiToCreation()` (UI → API) in `workflow.models.ts`.
6. **Lazy routes** — `DATA_ROUTES`, `EntitiesModule`, `KbSettingsModule`, `MetricsModule` (+ `ActivityModule` inside it), `TASK_AUTOMATION_ROUTES`, `WIDGETS_ROUTES` (ARAG only), `ContextBoxPageModule`, and `LabelSetsModule` are re-exported from `app-routing.lazy.ts` and dynamically imported from `app-routing.module.ts`. Resource listing and editing are child routes of `/data/resources`; upload actions live there (there is no `/upload` route), and sync is `/data/sync`. `/user/*` routes are **not** lazy — their components are imported directly into `app-routing.module.ts` (no wrapper module). Account management (`/manage`) is not a lazy module here — there is no `AccountModule` in this app; `redirectToAdminGuard` sends users to the standalone `admin` app instead.
7. **`/metrics` always loads `MetricsModule`** — there is no REMI-only page or enabled/disabled guard split.
8. **Activity logs live at `/metrics/detailed`** — `ActivityModule` (`libs/common/src/lib/metrics/activity/`) is lazy-loaded inside `MetricsModule` at the `detailed` child route. There is no standalone `/activity` route on the KB.
9. **`/user/callbacks/saml` is temporary** — added for IDP-initiated SAML clients whose `RelayState` points here. Remove once those clients are updated to use the auth app's URL.
10. **`/simple` "Context Box" UI** — gated by `account.workflow === 'cowork'` (`NavigationService.contextBoxMode`), not a feature flag. `ContextBoxPageComponent` shows `ReaderExperienceComponent` (reader) or `ContextBoxComponent` (admin/contrib: upload, ShareFile sync, search), and blocks on an expired trial: with `FeaturesService.unstable.contextBoxNoTrial` (`context-box-no-trial`) on, account managers of a `cowork` account without a subscription (`BillingService.hasSubscription()`; a failed lookup blocks nothing) are sent to `getUpgradeUrl()` via `navigateExternal`; everyone else with an expired trial gets the non-dismissable `TrialExpiredModalComponent`. The payment flow itself (`BillingService.isContextBoxPaymentRequired`, `CheckoutContextBoxComponent`) lives in `apps/admin`.
11. **Context Box uploads keyed by batch** — `ContextBoxService.uploadStatus` is a map `{ [uploadIndex]: UploadStatus }` (one entry per `uploadFiles()` call) so concurrent batches don't overwrite each other's progress; `cleanUploads()` prunes completed entries on each new upload; `visibleUploads` flattens all batches.
12. **Media-file-blocked sentinel** — in `ContextBoxComponent.onFilesSelected()`, `maxMediaFileSize === 1` (from `account.limits.upload.upload_limit_max_media_file_size`) means "media files not supported on this plan" (shows the `context-box.no-media-files` toast), not a 1-byte limit.
13. **ARAG routes under `/workflows`** — `/:zone/arag/:agent` is handled by `redirectToWorkflowGuard` (last-used workflow, else `default`). `WorkflowsListComponent` shows all workflows; `AgentDashboardComponent` is at `./workflows/:id`.
14. **KB routes guarded by `knowledgeBoxOwnerGuard`** — `/manage`, `/ai-models`, `/users`, `/keys`, `/metrics` under `/:zone/:kb` require `knowledgeBoxOwnerGuard` (KB owner/admin). ARAG equivalents (plus `/widgets`) use `aragOwnerGuard`. `/users` also has `canDeactivate: [inviteInProgressGuard]` on both. KB `/widgets` has no guard — it is a redirect to `/search`; saved widgets are managed from the search page.
15. **`/prompt-lab` redirect** — permanently redirects to `/rag-lab`. Old bookmarks continue to work.
16. **ARAG `/sources` route** — rendered by `DriversPageComponent`; note the component name doesn't match the route.
17. **Account management lives in `apps/admin`, not here.** `/at/:account/manage/**` hits `redirectToAdminGuard`, which builds the equivalent URL on the `admin` app's own origin (via `NavigationService.getAccountManageUrl()`/`resolveGuardRedirect()`) and does a real cross-origin navigation, appending `from`/`app` query params so `admin` can offer a "back to workspace" link. Any in-app link pointing at account-management pages (billing, invite-collaborators, KB/ARAG "table inside a page" links, etc.) must go through `NavigationService.navigateExternal()`/`getAccountManageUrl()` instead of the Angular router — see `libs/core/AGENTS.md`.
