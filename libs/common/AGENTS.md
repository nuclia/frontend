# `@flaps/common` — Agent Guide

`@flaps/common` (Nx project `common`) is the **largest shared library** in this monorepo, containing the majority of the application UI — feature modules, pages, services, guards, pipes, directives, and charts — shared between `apps/dashboard` and `apps/rao`.

Both apps import this library via the TypeScript path alias:
```typescript
import { ... } from '@flaps/common';
// alias: @flaps/common → libs/common/src/index.ts
```

The library wraps domain concepts from `@nuclia/core` (SDK types and REST calls) and `@flaps/core` (app-level services) into Angular feature modules, routable components, guards, and utility services.

---

## Run Commands

```bash
nx test common       # Jest unit tests
```

> `libs/common` has no `build` or `lint` Nx targets — compiled as part of each consuming app.

---

## Feature Areas

```
account        ai-models      aws-onboarding   base
charts         directives     entities         features
guards         hint           kb-creation      knowledge-box-keys
knowledge-box-settings        knowledge-box-users        metrics
navbar         page-not-found pagination       pipes
rag-lab        resources      retrieval-agent  search-widget
select-account-kb             services         tasks-automation
token-dialog   topbar         upload           users-manage
utils          validators
```

---

## Annotated Project Structure

```
libs/common/src/
├── index.ts                          ← Full public API barrel
├── test-setup.ts
├── assets/
│   └── i18n/                         ← Translation JSON files for this lib
└── lib/
    ├── account/                      ← Account management module + routing
    │   ├── account.module.ts         ← NgModule + Routes (AccountModule)
    │   ├── metrics.service.ts        ← Usage/billing metrics service
    │   ├── index.ts
    │   ├── account-arag/             ← Account-level ARAG listing
    │   │   ├── account-arag.component.ts
    │   │   ├── arag-list/
    │   │   └── create-arag/
    │   ├── account-home/             ← Account home dashboard page
    │   ├── account-kbs/              ← KB list & management for an account
    │   │   ├── account-kbs.component.ts
    │   │   ├── account-kbs.service.ts
    │   │   ├── kb-list/
    │   │   └── users-dialog/
    │   ├── account-manage/           ← Account settings (delete account, etc.)
    │   │   └── account-delete/
    │   ├── account-models/           ← AI model provider config per account
    │   │   ├── account-models.component.ts
    │   │   ├── bedrock-authentication/  ← AWS Bedrock auth form
    │   │   ├── create-config/
    │   │   ├── custom-models/
    │   │   └── model-restrictons/
    │   ├── account-nua/              ← NUA client management
    │   │   ├── account-nua.component.ts
    │   │   ├── account-nua.service.ts
    │   │   ├── client-dialog/
    │   │   └── nua-activity/
    │   ├── account-status/           ← Account status banner
    │   ├── account-users/            ← Account-level user management
    │   ├── billing/                  ← Full billing feature
    │   │   ├── billing.component.ts
    │   │   ├── billing.module.ts
    │   │   ├── subscription.service.ts
    │   │   ├── checkout/
    │   │   ├── features/
    │   │   ├── history/
    │   │   ├── my-subscription/
    │   │   ├── redirect.component.ts
    │   │   ├── review/
    │   │   ├── subscriptions/
    │   │   └── usage/
    │   ├── invite-collaborators-modal/
    │   └── nuclia-tokens/            ← Nuclia token display/management
    │
    ├── ai-models/                    ← AI/LLM model configuration
    │   ├── ai-models.component.ts    ← Top-level AI models page (AiModelsComponent)
    │   ├── ai-models.utils.ts
    │   ├── learning-configuration.directive.ts
    │   ├── index.ts
    │   ├── anonymization/
    │   ├── answer-generation/        ← Generative model selector + reasoning config
    │   │   ├── answer-generation.component.ts
    │   │   ├── model-selector/
    │   │   ├── reasoning-config/
    │   │   └── user-keys/
    │   ├── extraction/               ← Extraction model + LLM config + split modal
    │   │   ├── extraction.component.ts
    │   │   ├── extraction-modal/
    │   │   ├── llm-configuration/
    │   │   └── split-modal/
    │   ├── semantic-model/           ← Semantic/embeddings model selector
    │   └── summarization/
    │
    ├── aws-onboarding/               ← AWS marketplace onboarding wizard
    │   ├── aws-onboarding.component.ts
    │   ├── aws.guard.ts              ← awsGuard
    │   ├── index.ts
    │   ├── aws-setup-account/
    │   └── step1-budget/
    │
    ├── base/                         ← Root shell components
    │   ├── base.component.ts         ← BaseComponent – root auth shell, starts notification polling
    │   ├── base.module.ts            ← BaseModule (declares BaseComponent + DashboardLayoutComponent)
    │   ├── empty.component.ts        ← EmptyComponent – blank placeholder
    │   ├── index.ts
    │   └── dashboard-layout/
    │       ├── dashboard-layout.component.ts   ← DashboardLayoutComponent – two-column layout with nav + topbar
    │       ├── dashboard-layout.component.html
    │       ├── dashboard-layout.service.ts     ← DashboardLayoutService – nav collapsed Signal state
    │       └── index.ts
    │
    ├── charts/                       ← Reusable chart components
    │   ├── charts.module.ts          ← ChartsModule
    │   ├── base-chart.directive.ts
    │   ├── chart-utils.ts
    │   ├── _charts-common.scss
    │   ├── index.ts
    │   ├── bar-chart/
    │   ├── empty-chart/
    │   ├── line-chart/
    │   └── range-chart/
    │
    ├── directives/                   ← Standalone directives
    │   ├── directives.module.ts
    │   ├── index.ts
    │   └── perfect-scroll/
    │
    ├── entities/                     ← Named Entity Recognition (NER/entity groups)
    │   ├── entities.component.ts     ← EntitiesComponent
    │   ├── entities.module.ts        ← EntitiesModule
    │   ├── ner.service.ts            ← NerService – loads entities from current KB
    │   ├── model.ts
    │   ├── index.ts
    │   ├── entity/
    │   └── entity-list/
    │
    ├── features/                     ← Premium feature advertisement modal
    │   ├── features-modal.component.ts
    │   └── index.ts
    │
    ├── guards/                       ← All Angular route guards
    │   ├── index.ts
    │   ├── auth.interceptor.ts       ← HTTP interceptor for auth token injection
    │   ├── permission.guard.ts       ← accountOwnerGuard, knowledgeBoxOwnerGuard, aragOwnerGuard
    │   ├── root.guard.ts             ← rootGuard – redirects to landing page
    │   ├── select-account.guard.ts   ← selectAccountGuard
    │   ├── select-kb.guard.ts        ← selectKbGuard
    │   ├── set-account.guard.ts      ← setAccountGuard
    │   ├── set-agent.guard.ts        ← setAgentGuard
    │   ├── set-kb.guard.ts           ← setKbGuard
    │   ├── set-local-kb.guard.ts     ← setLocalKbGuard (NucliaDB standalone mode)
    │   └── agent-feature-enabled.guard.ts   ← agentFeatureEnabledGuard
    │
    ├── hint/                         ← Contextual hint component
    │   ├── hint.component.ts         ← HintComponent
    │   ├── hint.module.ts
    │   └── index.ts
    │
    ├── kb-creation/                  ← KB creation wizard
    │   ├── kb-creation.component.ts  ← KbCreationComponent
    │   └── index.ts
    │
    ├── knowledge-box-keys/           ← API key management for a KB
    │   ├── knowledge-box-keys.component.ts   ← KnowledgeBoxKeysComponent
    │   ├── index.ts
    │   └── service-access/
    │
    ├── knowledge-box-settings/       ← KB settings page
    │   ├── knowledge-box-settings.component.ts   ← KnowledgeBoxSettingsComponent
    │   ├── knowledge-box-settings.module.ts
    │   └── index.ts
    │
    ├── knowledge-box-users/          ← KB user membership management
    │   ├── knowledge-box-users.component.ts   ← KnowledgeBoxUsersComponent
    │   └── index.ts
    │
    ├── metrics/                      ← Usage & quality metrics pages
    │   ├── metrics-page.component.ts   ← MetricsPageComponent – usage charts
    │   ├── remi-metrics.service.ts     ← RemiMetricsService – REMI quality scores
    │   ├── index.ts
    │   └── missing-knowledge-details/
    │
    ├── navbar/                       ← Side navigation bar
    │   ├── navbar.component.ts       ← NavbarComponent
    │   ├── navbar.module.ts          ← NavbarModule
    │   ├── small-navbar.directive.ts ← SmallNavbarDirective
    │   └── index.ts
    │
    ├── page-not-found/               ← 404 page
    │   ├── page-not-found.component.ts   ← PageNotFoundComponent
    │   ├── page-not-found.module.ts      ← PageNotFoundModule
    │   └── index.ts
    │
    ├── pagination/                   ← Reusable paginator
    │   ├── pagination.component.ts   ← PaginationComponent
    │   ├── pagination.module.ts
    │   └── index.ts
    │
    ├── pipes/                        ← Angular pipes
    │   ├── pipes.module.ts           ← PipesModule (FormatDatePipe, FormatTimePipe, SafeHtmlPipe)
    │   ├── format-date.pipe.ts
    │   ├── format-duration.pipe.ts
    │   ├── format-eta.pipe.ts
    │   ├── format-time.pipe.ts
    │   ├── generative-model.pipe.ts
    │   ├── learning-option.pipe.ts
    │   ├── line-break-formatter.pipe.ts
    │   ├── safe-html.pipe.ts
    │   └── index.ts
    │
    ├── rag-lab/                      ← RAG Lab experimentation tool
    │   ├── rag-lab.component.ts      ← RagLabComponent
    │   ├── rag-lab-page.component.ts ← RagLabPageComponent (routable page)
    │   ├── rag-lab.service.ts        ← RagLabService – runs generative queries across model configs
    │   ├── rag-lab.models.ts
    │   ├── _common-lab.scss
    │   ├── index.ts
    │   ├── lab-layout/
    │   ├── loading-dialog/
    │   ├── prompt-lab/               ← Prompt Lab view
    │   │   └── prompt-lab.component.ts  ← PromptLabComponent
    │   └── question-block/           ← Single Q&A block result card
    │       └── question-block.component.ts   ← QuestionBlockComponent
    │
    ├── resources/                    ← Resource (document) management
    │   ├── resources.component.ts    ← ResourcesComponent (routable)
    │   ├── resources.module.ts       ← ResourcesModule
    │   ├── resource-filters.utils.ts
    │   ├── resource-viewer.service.ts   ← ResourceViewerService
    │   ├── index.ts
    │   ├── edit-resource/            ← Full resource editor
    │   │   ├── edit-resource.component.ts   ← EditResourceComponent
    │   │   ├── edit-resource.module.ts
    │   │   ├── edit-resource.service.ts
    │   │   ├── edit-resource.helpers.ts
    │   │   ├── paragraph.service.ts
    │   │   ├── resource-navigation.service.ts
    │   │   ├── add-field/
    │   │   ├── annotation/
    │   │   ├── classification/
    │   │   ├── dropzone/
    │   │   ├── preview/              ← PreviewComponent, ResourceFileComponent, ResourceLinkComponent, ResourceTextComponent
    │   │   ├── profile/
    │   │   └── select-first-field/
    │   ├── resource-list/            ← Tabbed resource list (pending / processed / error)
    │   │   ├── resource-list.component.ts
    │   │   ├── resource-list.service.ts
    │   │   ├── resource-list.model.ts
    │   │   ├── error-resources-table/
    │   │   ├── pending-resources-table/
    │   │   ├── processed-resources-table/
    │   │   ├── resources-table/
    │   │   ├── table-pagination/
    │   │   └── title-cell/
    │   └── upload-button/            ← Inline "Upload" action button
    │
    ├── retrieval-agent/              ← ARAG (Retrieval Agent) full feature
    │   ├── retrieval-agent.component.ts   ← RetrievalAgentComponent (router-outlet shell)
    │   ├── arag.utils.ts
    │   ├── index.ts
    │   ├── activity/                 ← Agent activity log
    │   │   ├── agent-activity.component.ts   ← AgentActivityComponent
    │   │   ├── log-table.component.ts
    │   │   ├── log-table-modal.component.ts
    │   │   └── log.models.ts
    │   ├── agent-dashboard/          ← Visual workflow canvas (the main ARAG UI)
    │   │   ├── agent-dashboard.component.ts   ← AgentDashboardComponent
    │   │   ├── index.ts
    │   │   └── workflow/             ← Workflow engine
    │   │       ├── workflow.state.ts     ← Module-level Angular Signals state (sidebar, nodes, test agent)
    │   │       ├── workflow.service.ts   ← WorkflowService – builds DOM-based node graph (1285 lines)
    │   │       ├── workflow.effects.ts   ← WorkflowEffectService
    │   │       ├── workflow.models.ts    ← Types: NodeType, NodeConfig, SidebarType, etc.
    │   │       ├── workflow.utils.ts
    │   │       ├── index.ts
    │   │       ├── basic-elements/   ← ConnectableEntryComponent, NodeDirective, LinkService, FormDirective
    │   │       ├── nodes/            ← Ask, External, Guardrails, Rephrase node forms
    │   │       └── sidebar/          ← Rules, Test, Import, Export, Endpoint panels
    │   ├── drivers/                  ← Data source driver management
    │   │   ├── drivers-page.component.ts   ← DriversPageComponent
    │   │   ├── drivers.service.ts          ← DriversService (uses Signals + RxJS)
    │   │   ├── index.ts
    │   │   ├── dynamic-driver-form/  ← JSON-schema-driven form for any driver
    │   │   └── nuclia-driver/        ← Nuclia KB driver form
    │   └── sessions/                 ← ARAG session management
    │       ├── sessions.component.ts        ← SessionsComponent
    │       ├── sessions-list.component.ts   ← SessionsListComponent
    │       ├── index.ts
    │       └── session-info/         ← SessionInfoComponent – session detail view
    │
    ├── search-widget/                ← Search widget builder & deployment
    │   ├── search-page.component.ts         ← SearchPageComponent – widget preview/test
    │   ├── search-widget.service.ts         ← SearchWidgetService – snippet generation, widget CRUD
    │   ├── search-widget-storage.service.ts ← Persistence layer for widget configs
    │   ├── search-widget.models.ts
    │   ├── _common-form.scss
    │   ├── index.ts
    │   ├── search-configuration/     ← Complex multi-step search config form
    │   │   ├── search-configuration.component.ts
    │   │   ├── filter-assistant/
    │   │   ├── filter-expression-modal/
    │   │   ├── find-resource-modal/
    │   │   ├── generative-answer-form/
    │   │   ├── results-display-form/
    │   │   ├── routing-form/
    │   │   ├── save-config-modal/
    │   │   ├── search-box-form/
    │   │   └── search-request-modal/
    │   └── widgets/                  ← Widget list and widget form
    │       ├── widgets.component.ts
    │       ├── widget-list.component.ts
    │       ├── widgets.routes.ts        ← WIDGETS_ROUTES
    │       ├── index.ts
    │       ├── dialogs/              ← DuplicateWidgetDialog, RenameWidgetDialog
    │       └── widget-form/
    │
    ├── select-account-kb/            ← Account / KB selection screens
    │   ├── select-account-kb.module.ts
    │   ├── utils.ts                  ← KB_ROLE_TITLES, SORTED_KB_ROLES
    │   ├── index.ts
    │   ├── select-account/           ← SelectAccountComponent
    │   └── select-kb/                ← SelectKbComponent
    │
    ├── services/                     ← App-level singleton services
    │   ├── app.service.ts            ← AppService – locale BehaviorSubject, language change listener
    │   ├── standalone.service.ts     ← StandaloneService – NucliaDB standalone config check & version polling
    │   └── index.ts
    │
    ├── tasks-automation/             ← Data augmentation task management
    │   ├── tasks-automation.component.ts   ← TasksAutomationComponent (router-outlet shell)
    │   ├── tasks-automation.service.ts     ← TasksAutomationService – task CRUD + routing
    │   ├── tasks-automation.models.ts      ← AutomatedTask, OneTimeTask, DataAugmentationTask* types
    │   ├── tasks-automation.routes.ts      ← TASK_AUTOMATION_ROUTES
    │   ├── _task.common.scss
    │   ├── index.ts
    │   ├── task-details/             ← Task detail view
    │   │   ├── task-details.component.ts
    │   │   ├── task-execution/
    │   │   ├── task-settings/
    │   │   └── task-testing/
    │   ├── task-forms/               ← Individual task type forms
    │   │   ├── task-form.component.ts       ← TaskFormComponent (base)
    │   │   ├── task-route.directive.ts
    │   │   ├── ask/                  ← AskComponent
    │   │   ├── content-safety/       ← ContentSafetyComponent (llama-guard)
    │   │   ├── graph-extraction/     ← GraphExtractionComponent
    │   │   ├── labeler/              ← LabelerComponent
    │   │   ├── labeling-configuration/
    │   │   ├── llm-security/         ← LLMSecurityComponent (prompt-guard)
    │   │   └── question-answer/      ← QuestionAnswerComponent (synthetic-questions)
    │   └── task-list/                ← Task list overview
    │       ├── task-list.component.ts
    │       ├── task-card.component.ts
    │       └── task-duplicate-dialog.component.ts
    │
    ├── token-dialog/                 ← API token creation dialog
    │   ├── token-dialog.component.ts     ← TokenDialogComponent
    │   ├── expiration-modal.component.ts ← ExpirationModalComponent
    │   ├── token-dialog.module.ts
    │   └── index.ts
    │
    ├── topbar/                       ← Application top bar
    │   ├── topbar.component.ts       ← TopbarComponent
    │   ├── topbar.module.ts
    │   ├── index.ts
    │   ├── kb-switch/                ← KbSwitchComponent (KB selector dropdown in topbar)
    │   ├── standalone-menu/
    │   └── user-menu/
    │
    ├── upload/                       ← Multi-channel upload UI
    │   ├── upload.module.ts          ← UploadModule
    │   ├── upload.service.ts         ← UploadService – upload orchestration (523 lines)
    │   ├── upload.utils.ts
    │   ├── upload-routing.module.ts
    │   ├── csv-parser.ts
    │   ├── desktop-upload.service.ts
    │   ├── index.ts
    │   ├── create-link/              ← Link (URL) upload form
    │   ├── csv-select/               ← CSV file selection
    │   ├── extraction-select/
    │   ├── upload-bar/               ← UploadBarComponent – persistent upload progress bar
    │   ├── upload-data/              ← UploadDataComponent – tabbed upload hub
    │   ├── upload-files/             ← UploadFilesComponent, UploadFilesDialogComponent
    │   ├── upload-progress/          ← UploadProgressComponent, UploadProgressDialogComponent
    │   ├── upload-qna/
    │   ├── upload-sitemap/
    │   └── upload-text/
    │
    ├── users-manage/                 ← Generic user management widget
    │   ├── users-manage.component.ts   ← UsersManageComponent
    │   ├── users-manage.module.ts
    │   ├── users-manage.service.ts
    │   └── index.ts
    │
    ├── validators/                   ← Angular form validators
    │   ├── form.validator.ts
    │   └── index.ts
    │
    └── utils.ts                      ← KB role constants: SORTED_KB_ROLES, KB_ROLE_TITLES
```

---

---

## Guards

All guards are functional (not class-based). Defined in `libs/common/src/lib/guards/`.

| Guard | Enforces |
|---|---|
| `rootGuard` | Redirects unauthenticated users to login |
| `authGuard` | Checks `localStorage['JWT_KEY']` or `?token=` query param |
| `setAccountGuard` | Loads account from URL param via `SDKService.setCurrentAccount()` |
| `setKbGuard` | Loads KB from URL param via `SDKService.setCurrentKb()` |
| `setAgentGuard` | Loads ARAG from URL param via `SDKService.setCurrentRetrievalAgent()` |
| `setLocalKbGuard` | Like `setKbGuard` but for NucliaDB standalone mode |
| `selectAccountGuard` | Redirects if account already selected |
| `selectKbGuard` | Redirects if KB already selected |
| `accountOwnerGuard` | Account-owner role required |
| `knowledgeBoxOwnerGuard` | KB owner (SOWNER) role required |
| `aragOwnerGuard` | ARAG owner role required |
| `agentFeatureEnabledGuard` | Checks `FeaturesService.unstable.retrievalAgents` |
| `AuthInterceptor` | HTTP interceptor — injects `Authorization` header from JWT |

---

## Key Services

| Service | What it does |
|---|---|
| `WorkflowService` | Central orchestrator for the ARAG visual workflow canvas (1285 lines). Builds DOM-based node graph, manages connections, node CRUD. |
| `SearchWidgetService` | Widget snippet generation, widget CRUD, deploys search widget configs to KB. |
| `UploadService` | Upload orchestration — file, link, CSV, text (523 lines). |
| `AppService` | Locale `BehaviorSubject`, language-change listener. |
| `StandaloneService` | NucliaDB standalone config check + version polling. |
| `RagLabService` | Runs generative queries across multiple model configs for comparison. |
| `TasksAutomationService` | Data augmentation task CRUD + routing. |

**`workflow.state.ts`** (module-level signals, not inside a class) acts as a lightweight global store for the workflow canvas — exports `signal()` and `computed()` values for sidebar state, node data, and test panel.

---

## dashboard vs rao differences

| Feature | dashboard | rao |
|---|---|---|
| Metrics page | Yes | No |
| RAG Lab / Prompt Lab | Yes | No |
| Search widget builder | Yes | No |
| ARAG (agent) | Yes | Yes |
| KB management | Yes | Yes |

`rao` is a stripped-down version focusing on ARAG and KB configuration.

---

## State Management Patterns

Three patterns coexist (newer code favours Signals):

### 1. RxJS BehaviorSubject (most prevalent)
```typescript
private _foo = new BehaviorSubject<Foo | null>(null);
foo = this._foo.asObservable(); // exposed readonly
```
Used in: `NerService`, `UploadService`, `RagLabService`, `RemiMetricsService`, `TasksAutomationService`.

### 2. Angular Signals (newer code)
- `DashboardLayoutService` — `signal()` + `computed()` for nav collapsed state
- `DriversService` — `signal<Driver[]>([])` alongside RxJS observable
- `workflow.state.ts` — module-level exported signals acting as a global store

### 3. Hybrid Signal + Observable
```typescript
private _drivers = signal<Driver[]>([]);          // Signal
drivers$ = this._refreshTrigger.pipe(             // Observable
  switchMap(...),
  tap((drivers) => this._drivers.set(drivers)),   // writes to signal
);
drivers = this._drivers.asReadonly();             // expose signal
```

---

## Important Conventions

1. **Component prefix**: All components use `selector: 'stf-*'` (configured in `project.json`).

2. **OnPush everywhere**: `project.json` generator config enforces `changeDetection: OnPush` for all newly generated components.

3. **Barrel `index.ts` in every feature directory**: Always import from the feature's `index.ts`, never from deep paths inside `@flaps/common`.

4. **i18n**: All user-visible strings are translation keys. Translation JSON files live in `src/assets/i18n/`.

5. **Services are `providedIn: 'root'`**: All services are tree-shakeable singletons. No `@NgModule` providers arrays for services.

6. **Lazy loading via `loadChildren`**: Heavy modules (`AccountModule`, `UploadModule`, `ResourcesModule`, `EntitiesModule`) and route arrays (`TASK_AUTOMATION_ROUTES`, `WIDGETS_ROUTES`) are loaded lazily from app routing.

7. **Guard functions (not classes)**: All guards use the functional API (`const myGuard = (route, state) => { inject(...); ... }`).

8. **Standalone components gradually replacing NgModules**: Recent features use standalone imports. Legacy features still use NgModules.

9. **SCSS tokens**: Feature-specific SCSS custom properties go in `_*.tokens.scss` files within the feature directory.

10. **`@nuclia/core` for domain shapes, `@flaps/core` for app services**: Domain model types and SDK API calls use `@nuclia/core`. App infrastructure (routing, config, auth, notifications) uses `@flaps/core`.

11. **Direct deep import for lazy loading**: Apps import modules directly from `libs/common/src/lib/...` in `loadChildren` callbacks to enable proper code splitting. This is intentional and suppressed with `eslint-disable` comments.
