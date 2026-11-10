# Manager V2 App — Agent Reference Guide

## Overview

**Manager V2** (`apps/manager-v2`) is an internal Angular administration console for Nuclia back-office operators (ROOT, MANAGER, READONLY roles). Manages:

- **Accounts** — create, configure, delete; manage limits, blocked features, KBs, custom AI models.
- **Users** — global platform user CRUD.
- **Zones** — NucliaDB deployment zones (cloud regions, subdomain config).

Role-based access is enforced via `ManagerStore` permission signals derived from `UserService.userType`.  
**Angular version:** 22 · **Zoneless** (`provideZonelessChangeDetection()`, `bootstrapApplication` in `main.ts`) · **Component prefix:** `nma` · **Change detection:** `OnPush`

**UI:** Spartan (`@nuclia/ui-spartan/*`, Tailwind). Shared pieces live in `libs/ui` with the `ui-` / `Ui` prefix: `UiConfirmService` (`@nuclia/ui/confirm-dialog`, `confirm(data): Observable<boolean>`) and `<ui-infinite-scroll>` (`@nuclia/ui/infinite-scroll`). Toasts use `toast` from `@spartan-ng/brain/sonner` directly (`toast.error(...)`); `<hlm-toaster />` is rendered once in `MainComponent`.

---

## Project Structure

```
apps/manager-v2/src/
├── _variables.scss   # sistema variables, still required by @flaps/common stylesheets (resolved via includePaths)
├── environments/ environments_config/production/
└── app/
    ├── app.routes.ts               # Top-level routes
    ├── app.component.ts            # Thin config-ready shell: shows Loading… until AppInitService resolves, then renders MainComponent
    ├── main.component.ts           # Bootstraps translations/remote-login and hosts the router-outlet + `<hlm-toaster />`; no header/nav (that's AppLayoutComponent)
    ├── user-callback/              # `provideUserCallback()`: Spartan overrides for `@nuclia/user` `CallbackComponent` (`UserNotifier` → sonner `toast` with translation, `CALLBACK_MESSAGE_VIEW` → Spartan message screen); wired in the `user/callback` route `providers`
    ├── manager.store.ts            # Global signal store (state + permissions)
    ├── app-layout/                 # Shell: header nav, avatar, permission-gated router-outlet
    ├── manage-accounts/            # lazy routes (`manage-accounts.routes.ts`): AccountService, account CRUD components
    │   ├── account.service.ts      # High-level orchestrator (global + regional + store)
    │   ├── global-account.service.ts   # REST: /manage/@account(s) (global API) + per-account budget endpoints
    │   ├── regional-account.service.ts # Zone-aware REST (KBs, models, per-zone Nuclia instances)
    │   └── account-details/            # ManagerStore-backed sub-detail components
    ├── manage-users/               # lazy routes (`manage-users.routes.ts`): UserService, user CRUD
    ├── manage-emails/              # standalone email wizard (ROOT only) — code exists but is NOT routed or linked in the nav (see Routing Architecture); Spartan/Tailwind UI, 3-step linear `ui-stepper`
    │   ├── manage-emails.component # spine: stepper + 3 `ui-step`; provides the 3 wizard services; on `wizard.completed$` jumps to step 1 (in `afterNextRender`, the stepper ignores steps still bound as non-editable) and shows the success toast
    │   ├── email.service / email.models / email-wizard.service / can-send-emails.guard   # feature-wide: API, wire types, send orchestration (scoped via the spine's `providers`), ROOT guard
    │   ├── step-recipients/        # step 1: `step-recipients`, `recipient-filters/`, `recipient-list/`, `recipients.service` (scoped), `recipients-loader.service`, `user-segments` (segment rules → `account_types` / `excluded_account_types` / `include_accounts` of `GET /manage/@users`; one request per segment, merged; subscription conditions applied client-side by joining users' `accounts` with `GET /billing/subscriptions`, see `GlobalAccountService.getSubscriptions`)
    │   ├── step-compose/           # step 2: `step-compose`, `personalization-help/`, `compose.service` (scoped), `email-body.utils`, `sender-name.utils` (mirrors the backend `sender_name` rules)
    │   └── step-review/            # step 3: `step-review`, `email-preview/` (preview with the backend's header/footer)
    └── manage-zones/               # lazy routes (`manage-zones.routes.ts`): ZoneService, zone CRUD (`zone-token-dialog/` shows the new zone token)
```

---

## Routing Architecture

```
/                           → redirect to /accounts
AppLayoutComponent (canActivate: authGuard)
├── /accounts               → MANAGE_ACCOUNTS_ROUTES (lazy)
│   ├── /accounts           → AccountListComponent (includes a "Trial Expiration" column from `AccountSummary.trial_expiration_date`)
│   ├── /accounts/add       → AddAccountComponent
│   └── /accounts/:accountId → AccountDetailsComponent (default child: config)
│       ├── /config         → ConfigurationComponent
│       ├── /kbs            → ContainersComponent (data: { mode: 'kb' })
│       ├── /agents         → ContainersComponent (data: { mode: 'agent' })
│       ├── /zone/:zoneId/kb/:kbId → KbDetailsComponent
│       ├── /projects       → ProjectListComponent
│       ├── /zone/:zoneId/project/:projectId → ProjectDetailsComponent
│       ├── /limits         → LimitsComponent
│       ├── /tokens         → TokenConsumptionComponent (standalone)
│       ├── /users          → UsersComponent
│       ├── /payment-links  → PaymentLinksComponent
│       ├── /subscriptions  → SubscriptionsComponent ('cloud zero' and 'manual' subscription forms)
│       ├── /models         → ModelsComponent (standalone)
│       ├── /models/add     → AddModelComponent (standalone)
│       ├── /models/:zoneSlug/model/:modelId      → AddModelComponent (edit mode, standalone)
│       └── /models/:zoneSlug/model/:modelId/kbs → ModelDetailsComponent (standalone)
├── /users                  → MANAGE_USERS_ROUTES (lazy)
│   ├── /users              → UserListComponent
│   ├── /users/add          → AddUserComponent
│   └── /users/:userId[/edit] → UserDetailsComponent
└── /zones                  → MANAGE_ZONES_ROUTES (lazy)
    ├── /zones              → ZoneListComponent
    └── /zones/:zoneId      → ZoneDetailsComponent  (:zoneId = "add" → create mode)
/user/callback               → CallbackComponent (from @nuclia/user, no authGuard)
/user/login-redirect         → AppLoginComponent (from @nuclia/user, no authGuard)
```

**`/emails` is disabled.** The route and `canSendEmailsGuard` import in `app.routes.ts` and the "Emails" nav item in `app-layout.component.html` are commented out ("waiting for the 'unsubscribe' button from the backend side"). `manage-emails/` and `ManagerStore.canSendEmails` stay in the tree; re-enable by uncommenting all three together.

---

## State Management

### `ManagerStore` (`src/app/manager.store.ts`)

Signal-based store (`providedIn: 'root'`): state is exposed as read-only signals (read with `store.x()`; components needing an rxjs pipeline wrap one in a field with `toObservable`). Central source for:

- `accountDetails`, `kbList`, `kbDetails`, `blockedFeatures`, `accountUsers`, `accountModels`, `currentState` — currently loaded account data
- `canEdit`, `canDelete`, `canFullyEditAccount`, `canSeeUsers`, `canCreateUser`, `canCreateAccount`, `canManageZones`, `canSendEmails`, `canManageModels`, `canAccessKBs`, `canUseManager` — permission signals derived from `UserService.userType`

**All UI permission checks use `ManagerStore` signals — never access `UserService.userType` directly from components.**

### `ZoneService` (`manage-zones/zone.service.ts`)

Eagerly loads all zones on construction. Exposes `zones` as a BehaviorSubject. Helpers: `getZoneDict()`, `getZoneSlug(id)`, `getAccountZonesDict(accountIdOrSlug)` (the account's zones — `sdk.nuclia.rest.getAccountZones` — intersected with the global zone dict).

---

## Service Architecture

**Two-layer account service pattern:**

- `GlobalAccountService` — global (non-zone) API at `/manage/@accounts` (CRUD, limits, blocked features, users, payment links, subscriptions) plus per-account budget endpoints (`GET/POST/PATCH/DELETE /billing/account/:id/budget`).
- `RegionalAccountService` — resolves zone slugs from `ZoneService`, instantiates per-zone `Nuclia` client instances for KB/project data. Project reads/creation (`getProjects`, `getProject`, `createProject`) are scoped to the **account's** zones via `ZoneService.getAccountZonesDict(accountId)`, never all zones. KB publish/unpublish is a zone-scoped `PATCH …/kb/:kbId` with `{ state: 'PUBLISHED' | 'PRIVATE' }` (`publishKb`), triggered from `KbDetailsComponent.togglePublish()`, which then updates `ManagerStore.kbDetails` (`KbDetails.published`).
- `AccountService` — composes both, keeps `ManagerStore` in sync after every mutation.

Grafana/Redash monitoring URLs are built in `RegionalAccountService.getKbList()` with special handling for the `europe-1` zone slug (remapped to `flaps` cluster).

`ConfigurationComponent` is a thin view over the component-scoped `ConfigurationService` (`vm`, in `account-details/configuration/`, which also has `configuration.utils.ts` and the `limit-field`/`budget-field` subcomponents). The service saves the account config form and the budget form together via `forkJoin` — budget is only fetched/editable when `ManagerStore.canFullyEditAccount` is true; when disabled the budget request is skipped (`of(null)`) instead of calling the API. The account-type select includes the `cowork` tier, and the form has an `allowAccessExternalModels` toggle (default on, sent as `allow_access_external_models`).

**Large features follow the same `vm` pattern** (component-scoped `<feature>.service.ts`, `.utils.ts`, `.model.ts`, subcomponents, one `<feature>.spec.ts` per feature): `subscriptions/` (`subscription-fields`, `subscription-delete`), `kb-details/` (`kb-members`; `potentialMembers` is a `toSignal` over the debounced search), `limits/` (`limit-row`), `token-consumption/` (`token-consumption-table`; state stays plain fields for `ngModel`/date pickers) and `manage-zones/zone-details/` (`zone-accounts` owns the whitelist and loads it via an `effect` on its `zoneId` input).

**User setup URL** — `UserDetailsComponent` shows a copyable "User setup URL" expander only for users with no `last_login`: `<auth origin>/setup/user?app=<platform|rag>` (origin via `sdk.getOriginForApp('auth')`, `app` chosen with a select). It targets the `apps/auth` `/setup/user` route (`SetupUserComponent` in `libs/user`).

---

## Guard Summary

| Guard                       | Behaviour                                                                                                                                                                                         |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `authGuard` (`@flaps/core`) | Checks `JWT_KEY` in localStorage (or a magic `?token=` param). Redirects to `/user/login-redirect` + saves intended URL/query params. Applied to `AppLayoutComponent` and all three child routes. |

---

## Styling

Spartan components + Tailwind utilities in templates; no component SCSS. Page layout: `div.px-6`, `h3.mb-4.text-xl.font-semibold`, footers `footer.flex.gap-4.py-6`, forms `flex max-w-lg flex-col gap-4`. Tailwind utilities sit in CSS layers, so unlayered global SCSS wins (use `!` modifiers if needed). `hlmBtn` inside a `<form>` defaults to `type=submit`.

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

1. **Standalone-first** — components are standalone by default (Angular 22); features are lazy-loaded via `*.routes.ts` route arrays (`loadChildren`); there are no NgModules left in the app.
2. **ManagerStore as permissions bus** — always read permissions from `ManagerStore` (`canEdit`, `canDelete`, etc.).
3. **Lazy-loaded feature routes** — `accounts`, `users`, `zones` all use `loadChildren`. Keep it that way.
4. **Two-layer account service** — `GlobalAccountService` for global mutations; `RegionalAccountService` for zone-aware reads; `AccountService` orchestrates both.
5. **Zone route dual-use** — `/zones/:zoneId` shares `ZoneDetailsComponent` for create (`:zoneId = 'add'`) and edit.
6. **Component prefix `nma`** — all selectors must start `nma-`.
7. **Runtime config** — never hardcode backend URLs; use `BackendConfigurationService`.
8. **`/user/callback` and `/user/login-redirect`** — top-level routes (siblings of the guarded shell route, no `authGuard`) rendering `CallbackComponent` / `AppLoginComponent` imported directly from `@nuclia/user`.
9. **`AppComponent` is a config-ready shell** — it renders `Loading…` until `AppInitService` resolves, then switches to `<nma-main>` (`MainComponent`). `MainComponent` only bootstraps translations/remote-login and hosts `<router-outlet>` + `<hlm-toaster />`; the header/nav/avatar layout lives in `AppLayoutComponent`, not `MainComponent`. Never put feature UI in `AppComponent`.
10. **Account creation campaign** — `AddAccountComponent` sends a required `campaign_id` chosen from a hardcoded `CAMPAIGN_IDS` list; new campaigns must be added to that constant.
