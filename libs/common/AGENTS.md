# `@flaps/common` — Agent Guide

Nx project: `common`. Largest shared library — feature modules, pages, services, guards, pipes, and charts shared between `apps/dashboard` and `apps/rao`, plus a subset consumed by `apps/admin` (`base/`, `guards/`, `select-account-kb/`, `topbar/`, `navbar/`, `aws-onboarding/`, `charts/`, `profile/`, `kb-creation/`, `knowledge-box-keys/`, `token-dialog/`, `users-manage/`, and the `account/` pieces). Not independently buildable; compiled as part of each consuming app.

Cross-cutting services (`UploadService`, `ResourceListService`, `EditResourceService`, `ResourceNavigationService`, `NerService`, `KvSchemasService`) live in `@flaps/core`, not here.

```typescript
import { ... } from '@flaps/common'; // → libs/common/src/index.ts
```

```bash
nx test common       # Jest unit tests (no build/lint targets)
```

---

## Architecture

All feature code lives under `libs/common/src/lib/`. Major areas:

```
account/           ← Account pieces `admin` imports: MetricsService, AccountStatusComponent, BudgetComponent (usage budget),
                      AccountDeleteComponent + otp-input (deletion flow; the re-auth request is bound to the account id)
ai-models/         ← KB-level AI/LLM model configuration (extraction, generation, semantic, summarization, anonymization)
base/              ← Root shell: BaseComponent (auth + notification polling), DashboardLayoutComponent
chat-advice/       ← AI chat assistant prototype (ChatAdviceService, ChatAdviceBubbleComponent)
charts/            ← Reusable chart components (bar, line, range) using base-chart directive
data/              ← KB Data page shell and tabs; `data.routes.ts` composes `resources` (`RESOURCE_ROUTES`) with `sync` (`SYNC_ROUTES` from `@nuclia/sync`, via `sync-lazy.ts`)
                      `DataPageComponent` provides `DataPageStatusService`; `ResourceListComponent` (optional inject) publishes its `#statusFilters` template into it so the filters render in the page header, and clears it on destroy
entities/          ← NER entity group management
guards/            ← All route guards (functional, not class-based)
metrics/           ← Activity logs & REMI quality analytics (dashboard-only, 7 pages + detailed logs; see Metrics Module)
  activity/        ← "Detailed logs" — ActivityModule (lazy inside MetricsModule at /metrics/detailed)
  rag-advice/      ← AI-generated advice on how to improve RAG scores (RagAdviceService + RagAdviceComponent)
  remi-score-badge/← Coloured badge for REMI score display (RemiScoreBadgeComponent)
onboarding/        ← Post-signup flow (see Onboarding below)
profile/           ← User profile page (ProfileComponent) — name/language/password preferences
rag-lab/           ← "Lab" (route `rag-lab`; `prompt-lab` redirects to it): `RagLabPageComponent` tabs = prompt lab + RAG lab, sharing `LabLayoutComponent`
resources/         ← Resource editor and list; `resource.routes.ts`: `:status` (all/processed/pending/error) → `ResourceListComponent`, `:id/edit/**` → editor
  resource-list/   ← `ResourcesTableDirective` holds the shared table/bulk-action logic used by the processed/pending/error tables (see Resource List below)
  memory/          ← `MemoryComponent` (route `resource/:id/memory`) — reads the synthetic 'memory' field
                      (FIELD_TYPE) to show conversation sessions/facts/entries; `MemoryService` is
                      component-provided (not root) and batches session loads (`MEMORY_LOAD_CONCURRENCY = 6`)
retrieval-agent/   ← ARAG: visual workflow canvas, workflows list, drivers, sessions, activity log
search-widget/     ← Search page: search configuration panel + widget deployment/embed (see Search Page below)
services/          ← AppService (locale)
tasks-automation/  ← Data augmentation task CRUD. Route paths differ from component names: `ask`, `synthetic-questions` (QuestionAnswer), `labeler`, `llm-graph` (GraphExtraction), `prompt-guard` (LLMSecurity), `llama-guard` (ContentSafety), each with `/:taskId`; bare `:taskId` → TaskDetails
upload/            ← Upload dialogs (file, link, CSV, sitemap, text, Q&A) and `UploadModule`; `DesktopUploadService` only holds connector logos/titles
```

In the dashboard navbar, **Data** opens `/:zone/:kb/data/resources`. `DataPageComponent` always shows
Resources and Synchronize tabs (`/data/sync`); the Connect (BETA) tab (`/data/sync/connect`) only shows when
`FeaturesService.unstable.agenticSearch` is enabled. Upload actions are part of Resources,
not a separate navigation destination.

Other small areas: `aws-onboarding/` (includes `awsGuard`), `directives/`, `features/`, `kb-creation/`, `knowledge-box-keys/`, `knowledge-box-settings/`, `knowledge-box-users/`, `navbar/`, `page-not-found/`, `pagination/`, `pipes/`, `select-account-kb/`, `token-dialog/`, `topbar/`, `users-manage/`, `validators/`.

**`knowledge-box-settings/` sub-structure:**

- `KnowledgeBoxSettingsComponent` — KB general settings (name, description, slug); also routed directly (without tabs) for ARAG/RAO `manage`
- `kv-schemas/kb-settings.module.ts` — `KbSettingsModule` (lazy-loaded): routes `general → KnowledgeBoxSettingsComponent` (route `data: { embedded: true }` switches the component to its in-tab layout), `kv-schemas → KvSchemasComponent`; wraps `KbSettingsLayoutComponent` (tab shell)
- Barrel exports `KnowledgeBoxSettingsComponent` + `KbSettingsModule`

---

## Guards

All functional guards in `libs/common/src/lib/guards/`:

| Guard                      | Enforces                                                                                                                                                                                                                             |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `rootGuard`                | Calls `NavigationService.goToLandingPage()` and always blocks (returns `false`)                                                                                                                                                      |
| `setAccountGuard`          | `SDKService.setCurrentAccount()`, sets `nuclia.options.accountId` and `NavigationService.setContextBoxMode(account.workflow === 'cowork')`; failure → account select URL                                                             |
| `setKbGuard`               | Finds the KB by slug among the zone's KBs (unknown slug → `sdk.cleanAccount()` + `/select`), sets it current, and nulls `sdk.arag`                                                                                                   |
| `setAgentGuard`            | Same for ARAG; redirects to `/select` unless `FeaturesService.unstable.retrievalAgents`                                                                                                                                              |
| `contextBoxModeGuard`      | `CanActivateFn` — when `NavigationService.contextBoxMode` is true, redirects KB home to `<kbUrl>/simple`                                                                                                                             |
| `canMatchContextBoxMode`   | `CanMatchFn` (used by `admin`) — reads the account slug from the navigation URL and calls `setCurrentAccount`, so on page refresh it sees `account.workflow === 'cowork'` before `setAccountGuard` runs                              |
| `redirectToWorkflowGuard`  | ARAG entry point only: redirects to the last-used workflow canvas (fallback `default`); an explicit `/workflows` URL still shows the list                                                                                            |
| `selectAccountGuard`       | Handles `/select` and `/select/:account`: no accounts → onboarding (if `userInfo.create`) or logout; exactly one account → auto-selects it and goes to `/select/:account`                                                            |
| `selectKbGuard`            | No KB/ARAG: manager of a `cowork` account → `/user/onboarding?account_slug=…`, other managers → account-manage URL on `admin`. Auto-selects the single KB (or the `ContextBox` KB), or the single ARAG, except in `rao` (`inRaoApp`) |
| `selectAccountManageGuard` | `admin`-only: trivial redirect from `/select/:account` straight to the account-manage URL — no KB/ARAG picker to show                                                                                                                |
| `redirectToAdminGuard`     | Used by `dashboard`/`rao` on `/at/:account/manage/**`: builds the equivalent URL on `admin`'s origin and redirects (same- or cross-origin) via `NavigationService.resolveGuardRedirect()`                                            |
| `accountOwnerGuard`        | `account.can_manage_account` required, else redirect to `NavigationService.homeUrl`                                                                                                                                                  |
| `knowledgeBoxOwnerGuard`   | `kb.admin` required, else redirect to home URL                                                                                                                                                                                       |
| `aragOwnerGuard`           | `arag.admin` required, else redirect to home URL                                                                                                                                                                                     |
| `agentFeatureEnabledGuard` | Checks `FeaturesService.unstable.retrievalAgents`                                                                                                                                                                                    |

---

## dashboard vs rao vs admin

`rao` is a stripped-down `dashboard`. Metrics and Lab (`rag-lab/`) are **dashboard-only**; the Search page (`SearchPageComponent`) and ARAG pages are shared. Account management (billing, users, API keys, account deletion) is **not** shared between `dashboard`/`rao` — it lives in the standalone `apps/admin` app; `dashboard`/`rao` only hold `redirectToAdminGuard` and a handful of components `admin` still imports from here (see `account/` above).

---

## Non-obvious Patterns

### State: three patterns coexist

- **RxJS BehaviorSubject** — most prevalent (`RagLabService`, `OnboardingService`, etc.)
- **Angular Signals** — newer code: `DashboardLayoutService`, `DriversService`, `workflow.state.ts`, all metrics data services
- **Hybrid Signal + Observable** — `DriversService` uses an observable pipeline that writes to a signal via `tap()`; exposes the signal as readonly

### `workflow.state.ts` — module-level signals store

Exports `signal()` and `computed()` at module level (not inside a class) for sidebar state, node data, and test panel. `WorkflowService` (very large) builds a DOM-based node graph — the visual workflow canvas.

### Deep imports for lazy loading

Apps import modules directly from `libs/common/src/lib/...` in `loadChildren` callbacks (e.g., `MetricsModule`). This breaks module boundary rules and is suppressed with `eslint-disable @nx/enforce-module-boundaries`. Intentional for code splitting.

### `@nuclia/core` vs `@flaps/core`

- `@nuclia/core` — domain model types and SDK API calls
- `@flaps/core` — app infrastructure (routing, config, auth, notifications)

---

## Conventions

- **Component prefix**: `stf-*` (enforced in `project.json`)
- **OnPush**: enforced for all new components via generator config
- **SCSS tokens**: feature-specific custom properties in `_*.tokens.scss` files
- **Barrel exports**: every feature directory has `index.ts`; import from the barrel, not deep paths
- **Standalone by default**: components, pipes and directives have no explicit `standalone` property (Angular 22 default). NgModules still exist as feature/lazy-route wrappers (e.g. `MetricsModule`, `ActivityModule`, `KbSettingsModule`, `UploadModule`, `UsersManageModule`, `EntitiesModule`)

---

## Search Page & Configuration Panel — Gotchas

`SearchPageComponent` (`search-widget/`) hosts `SearchConfigurationComponent` (accordion panel) beside a live widget preview. Routes: dashboard KB `search` and `search/:widgetSlug` (`initialWidgetSlug` input selects the config linked to that widget); in the KB app `widgets` and `widgets/:slug` redirect to `search`. The old widget list/editor (`widgets/`, `WIDGETS_ROUTES`) is still routed for ARAG and `rao`, and `inArag` switches `createRaoWidget` vs `createWidget`.

- **Config ↔ widget is 1:1 in the UI.** `linkedWidget` (via `findLinkedWidget`) is the widget whose `searchConfigId` equals the selected config; `undefined` = never deployed. Storage still lets a widget reference any config id.
- **Widget options accordion** (`WidgetOptionsFormComponent`) edits the linked widget's appearance (defaults when none). `isConfigModified` is true if either the search config **or** the widget options changed.
- **Save paths** (`_persistWidgetDeployment`): overwrite updates the linked widget in place; "save as new" on a deployed config also creates a widget for the new config; an undeployed config persists nothing widget-related — first deployment happens only through **Get embed code** (`triggerGetEmbedCode` → `getEmbedCode` output → `SearchPageComponent.openEmbedCode` regenerates the snippet with the real widget id).
- **`nuclia-*` configs are read-only defaults**: saving requires a new name (`SaveConfigModalComponent`, reason `default-readonly`/`default-embed`); embed code is disabled for a modified non-default config, and only `type: 'config'` (not `'api'` JSON configs) can be embedded.
- Configs and widgets live in `kb.search_configs` (`searchConfigurations`, `widgets`, `ragLabQuestions`) via `SearchWidgetStorageService`; `'api'` configs come from the search-configs API, not `kb.search_configs`.
- `ManageWidgetsModalComponent` (rename/duplicate/delete) closes with a `SearchConfigurationSelection` (`configId`, optional `widgetSlug`) to load that item; closing without one makes the panel re-read configs.

---

## Resource List — Gotchas

- `PinnedHeaderHeightDirective` publishes the list header height as `--resource-list-header-height` so the table header pins below a wrapping filter bar.
- Bulk delete (`ResourcesTableDirective.bulkDelete`): when all resources are selected and there is no query or visibility (`HIDDEN_PREFIX`) filter, it uses a single `kb.deleteAllResources({ filter_expression })` request (matching-all expression if no filters) and waits for `totalItems` to reach 0; otherwise it deletes resources individually with concurrency 6.

---

## Onboarding — Gotchas

- Step ids: 1 signup/company, 2 workflow choice (classic vs `cowork`; only in the sequence when `FeaturesService.unstable.coworkAccount`), 3 zone, 4 embedding model, 5 setting-up. Once the workflow is stored, `setSteps` drops step 2 (`[1, 3, 4, 5]`). `rao` uses `[1, 4, 5]`.
- `/user/onboarding?account_slug=…` (provisioned or Context Box account without a KB) starts at step 3 with that account.
- A `cowork` account creates a KB titled `ContextBox` plus a retrieval agent wired to it (`createContextBox`); otherwise a `Default` KB. If account creation succeeded but KB creation fails, the user is sent to `/at/:account`.

---

## Users Invitations

`UsersManageService` is `@Injectable()` (provided by `KnowledgeBoxUsersComponent` or the admin dialog). Emails are pasted/split into entries with statuses (`valid`, `invalid`, `duplicate`, `existing`, `failed`) and sent sequentially; while `inviteInProgress()` is true a `beforeunload` handler is active and `inviteInProgressGuard` (`canDeactivate` on the `users` route) asks for confirmation.

---

## Metrics Module — Gotchas

Dashboard-only feature at `libs/common/src/lib/metrics/` lazy-loaded via `MetricsModule` (guarded by `knowledgeBoxOwnerGuard` in app routing).

### Sub-pages

`MetricsModule` has 8 child routes:

| Route                   | Component                                                                                |
| ----------------------- | ---------------------------------------------------------------------------------------- |
| `usage-analytics`       | `UsageAnalyticsPageComponent`                                                            |
| `tokens-and-time-usage` | `CostTokenUsagePageComponent`                                                            |
| `resource-activity`     | `ResourceActivityPageComponent`                                                          |
| `search-activity`       | `SearchActivityPageComponent`                                                            |
| `chat-activity`         | `ChatActivityPageComponent`                                                              |
| `user-feedback`         | `UserFeedbackPageComponent`                                                              |
| `remi-analytics`        | `RemiAnalyticsPageComponent`                                                             |
| `detailed`              | `ActivityModule` (lazy) — "Detailed Logs": CSV/NDJSON download with resource/search tabs |

`ActivityModule` (`metrics/activity/`) contains `ActivityDownloadComponent`, `ActivityLogTableComponent`, and `ActivityService` (polls `DownloadStatus: 'pending' | 'ready'`).

### Abstract service pattern

`AbstractMetricsPageService<T, R = T[]>` — subclasses call `initPipeline()` in constructor, implement `loadData()`, `_queryPage()`, `_applyPage()`, `loadAvailableMonths()`. Pipeline: `_reset$` uses `switchMap` (cancels in-flight), `_nextPage$` uses `exhaustMap` (ignores while busy). `R` type param allows grouped results (e.g., `ResourceActivityGroup[]`).

### Config files derive from SDK arrays

Page `*.config.ts` files define columns by **filtering** the SDK's `as const` arrays, not re-enumerating. New SDK fields are included by default unless explicitly excluded.

### Resource-activity synthetic status

Queries 3 event types simultaneously (`NEW`, `MODIFIED`, `PROCESSED`), each with its own pagination cursor (`_lastIds` signal — `Record<string, number | undefined>`). Status is a display-only `_displayStatus` field injected during mapping — **not** an API filter.

### Usage-analytics: `content_relevance` + `status_code` mutual exclusion

Uses the REMI query API (`queryRemiScores`), **not** activity logs. The API accepts only one of `context_relevance` (UI filter key `content_relevance`) and `status_code`. When the relevance filter is set, the page runs a single query (no per-status pagination) and status displays as `'—'`.

### Per-component service provisioning

Unlike most services in this lib (`providedIn: 'root'`), metrics services are provided per-component: `MetricsPageService` → `MetricsPageComponent`, `MetricsFiltersService` → `MetricsFiltersComponent`, `RemiMetricsService` → `RemiAnalyticsPageComponent`, each page data service → its page component.

### REMI analytics page

`RemiAnalyticsPageComponent` uses `RemiMetricsService` (BehaviorSubject-based, not the abstract service pattern).

### RAG Advice

`RagAdviceService` (in `metrics/rag-advice/`) posts an `AdviceInput` (question, answer, context, REMI scores, RAG params, `iterationHistory`) to an advice endpoint and may be called iteratively. `RagAdviceComponent` renders the advice alongside the REMI analytics page.
