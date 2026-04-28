# `@flaps/common` — Agent Guide

Nx project: `common`. Largest shared library — feature modules, pages, services, guards, pipes, and charts shared between `apps/dashboard` and `apps/rao`. Not independently buildable; compiled as part of each consuming app.

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
account/           ← Account management, billing, NUA clients, AI model config
ai-models/         ← KB-level AI/LLM model configuration (extraction, generation, semantic, summarization)
base/              ← Root shell: BaseComponent (auth + notification polling), DashboardLayoutComponent
charts/            ← Reusable chart components (bar, line, range) using base-chart directive
entities/          ← NER entity group management
guards/            ← All route guards (functional, not class-based)
metrics/           ← Activity logs & REMI quality analytics (dashboard-only, 5 sub-pages)
  rag-advice/      ← AI-generated advice on how to improve RAG scores (RagAdviceService + RagAdviceComponent)
  remi-score-badge/← Coloured badge for REMI score display (RemiScoreBadgeComponent)
rag-lab/           ← RAG Lab: generative queries across model configs for comparison
resources/         ← Resource CRUD, editor, list with pending/processed/error tabs
retrieval-agent/   ← ARAG: visual workflow canvas, workflows list, drivers, sessions, activity log
search-widget/     ← Search widget builder & deployment config
services/          ← AppService (locale), StandaloneService (NucliaDB standalone mode)
tasks-automation/  ← Data augmentation task CRUD (ask, labeler, graph-extraction, etc.)
upload/            ← Multi-channel upload (file, link, CSV, sitemap, text, Q&A)
```

Other small areas: `aws-onboarding/`, `directives/`, `features/`, `hint/`, `kb-creation/`, `knowledge-box-keys/`, `knowledge-box-settings/`, `knowledge-box-users/`, `navbar/`, `page-not-found/`, `pagination/`, `pipes/`, `select-account-kb/`, `token-dialog/`, `topbar/`, `users-manage/`, `validators/`.

---

## Guards

All functional guards in `libs/common/src/lib/guards/`:

| Guard                      | Enforces                                                                                             |
| -------------------------- | ---------------------------------------------------------------------------------------------------- |
| `rootGuard`                | Redirects unauthenticated users to login                                                             |
| `setAccountGuard`          | Loads account from URL param via `SDKService.setCurrentAccount()`                                    |
| `setKbGuard`               | Loads KB from URL param via `SDKService.setCurrentKb()`                                              |
| `setAgentGuard`            | Loads ARAG from URL param via `SDKService.setCurrentRetrievalAgent()`                                |
| `setLocalKbGuard`          | Like `setKbGuard` but for NucliaDB standalone mode                                                   |
| `simpleModeGuard`          | `CanActivateFn` — when `NavigationService.simpleMode` is true, redirects KB home (`/`) to `./simple` |
| `selectAccountGuard`       | Redirects if account already selected                                                                |
| `selectKbGuard`            | Redirects if KB already selected                                                                     |
| `accountOwnerGuard`        | Account-owner role required                                                                          |
| `knowledgeBoxOwnerGuard`   | KB owner (SOWNER) role required                                                                      |
| `aragOwnerGuard`           | ARAG owner role required                                                                             |
| `agentFeatureEnabledGuard` | Checks `FeaturesService.unstable.retrievalAgents`                                                    |
| `AuthInterceptor`          | HTTP interceptor — injects `Authorization` header from JWT                                           |

---

## dashboard vs rao

`rao` is a stripped-down `dashboard`. Metrics, RAG Lab, and search widget builder are **dashboard-only**. ARAG and KB management are shared.

---

## Non-obvious Patterns

### State: three patterns coexist

- **RxJS BehaviorSubject** — most prevalent (`NerService`, `UploadService`, `RagLabService`, etc.)
- **Angular Signals** — newer code: `DashboardLayoutService`, `DriversService`, `workflow.state.ts`, all metrics data services
- **Hybrid Signal + Observable** — `DriversService` uses an observable pipeline that writes to a signal via `tap()`; exposes the signal as readonly

### `workflow.state.ts` — module-level signals store

Exports `signal()` and `computed()` at module level (not inside a class) for sidebar state, node data, and test panel. `WorkflowService` (1285 lines) builds a DOM-based node graph — the visual workflow canvas.

### Deep imports for lazy loading

Apps import modules directly from `libs/common/src/lib/...` in `loadChildren` callbacks (e.g., `MetricsModule`, `AccountModule`). This breaks module boundary rules and is suppressed with `eslint-disable @nx/enforce-module-boundaries`. Intentional for code splitting.

### `@nuclia/core` vs `@flaps/core`

- `@nuclia/core` — domain model types and SDK API calls
- `@flaps/core` — app infrastructure (routing, config, auth, notifications)

---

## Conventions

- **Component prefix**: `stf-*` (enforced in `project.json`)
- **OnPush**: enforced for all new components via generator config
- **SCSS tokens**: feature-specific custom properties in `_*.tokens.scss` files
- **Barrel exports**: every feature directory has `index.ts`; import from the barrel, not deep paths
- **Standalone components** gradually replacing NgModules; legacy features still use NgModules

---

## Metrics Module — Gotchas

Dashboard-only feature at `libs/common/src/lib/metrics/` lazy-loaded via `MetricsModule` (guarded by `knowledgeBoxOwnerGuard` + `metricsEnabledGuard`).

### Legacy vs New metrics

Two parallel implementations exist:

- **`metrics/legacy/`** — `LegacyRemiMetricsPageComponent` + `LegacyRemiMetricsModule`. Used when `FeaturesService.unstable.metrics` is **off**. The original REMI-only view.
- **`metrics/`** (new) — `MetricsModule` with full sub-pages. Used when `FeaturesService.unstable.metrics` is **on**.

Routes are split with `canMatch` guards (`metricsEnabledGuard` / `metricsDisabledGuard`) in the app routing; `ActivityModule` is also disabled when metrics are enabled (activity lives inside the new `MetricsModule`).

### Abstract service pattern

`AbstractMetricsPageService<T, R = T[]>` — subclasses call `initPipeline()` in constructor, implement `loadData()`, `_queryPage()`, `_applyPage()`, `loadAvailableMonths()`. Pipeline: `_reset$` uses `switchMap` (cancels in-flight), `_nextPage$` uses `exhaustMap` (ignores while busy). `R` type param allows grouped results (e.g., `ResourceActivityGroup[]`).

### Config files derive from SDK arrays

Page `*.config.ts` files define columns by **filtering** the SDK's `as const` arrays, not re-enumerating. New SDK fields are included by default unless explicitly excluded.

### Resource-activity synthetic status

Queries 3 event types simultaneously (`NEW`, `MODIFIED`, `PROCESSED`), each with its own pagination cursor (`_lastIds` signal — `Record<string, number | undefined>`). Status is a display-only `_displayStatus` field injected during mapping — **not** an API filter.

### Usage-analytics: `content_relevance` + `status_code` mutual exclusion

Uses the REMI query API (`queryRemiScores`), **not** activity logs. `content_relevance` and `status_code` are **mutually exclusive** — setting both throws. When `content_relevance` is set, falls back to single-query mode (no per-status pagination), status displays as `'—'`.

### Per-component service provisioning

Unlike most services in this lib (`providedIn: 'root'`), metrics services are provided per-component: `MetricsPageService` → `MetricsPageComponent`, `MetricsFiltersService` → `MetricsFiltersComponent`, `RemiMetricsService` → `RemiAnalyticsPageComponent`, each page data service → its page component.

### REMI analytics page

`RemiAnalyticsPageComponent` is **standalone** (not declared in `MetricsModule`). Uses `RemiMetricsService` (BehaviorSubject-based, not the abstract service pattern).

### RAG Advice

`RagAdviceService` (in `metrics/rag-advice/`) provides AI-generated suggestions for improving REMI scores. It accepts an `AdviceInput` object (question, answer, context, REMI scores, RAG params, iteration history) and posts to an advice endpoint. The response includes structured advice and may be called iteratively — `iterationHistory` tracks previous rounds to refine suggestions. `RagAdviceComponent` renders the advice alongside the REMI analytics page.
