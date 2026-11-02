# AGENTS.md — `libs/core` (`@flaps/core`)

**Import path:** `@flaps/core` | **Nx project:** `core` | **Selector prefix:** `stf`

Shared Angular foundation library consumed by first-party apps (`admin`, `dashboard`, `manager-v2`, `rao`). No separate build target — transpiled as part of the consuming app.

Provides: SDK wrapper (`SDKService`), bootstrap config, auth flows, feature flags, navigation URL builder, billing API client, label management, resource list/edit/upload services, KV-schema and NER services, filter-expression modal, real-time notifications, analytics (GTM + Pendo), and shared UI utilities.

Component selector prefixes are mixed: `stf-` for most, `app-` for label/upload components, `ncom-` for `ncom-hint`. Follow the neighbouring files when adding one.

---

## Run Commands

```bash
nx test core    # Vitest via Angular builder (no build / lint targets; own test-build target)
```

---

## Project Structure

```
libs/core/src/lib/
├── analytics/
│   ├── analytics.service.ts        # GTM dataLayer pushes
│   ├── feature-flag.service.ts     # CDN-driven feature flags (low-level MD5 rollout)
│   ├── features.service.ts         # Permission/tier-aware feature flags (high-level)
│   └── pendo.service.ts            # Feeds visitor/account metadata to Pendo (prod-only; see each
│                                      app's index.html for the loader script). Shared by `dashboard` and `admin`.
├── api/
│   ├── sdk.service.ts              # ★ SDKService — central SDK wrapper & reactive state hub
│   ├── account.service.ts          # Account-level API calls
│   ├── billing.service.ts          # Stripe/AWS/Manual/Cloud Zero billing API client — incl. `getTrialTokenUsage()` and the Context Box payment-flow observables (see BillingService below)
│   ├── bedrock.service.ts          # AWS Bedrock assume-role auth flow (start/finish/delete)
│   ├── sso.service.ts              # SSO login URL builder + code exchange (Google/GitHub/Microsoft)
│   ├── user.service.ts             # Current user info
│   └── zone.service.ts             # Available deployment zones
├── auth/
│   ├── auth.guard.ts               # authGuard (functional) — checks JWT_KEY or ?token= or ?signup_token=; SAML IdP-initiated logins always go through login
│   ├── auth.service.ts             # Stores pre-login redirect URL in localStorage; setSignUpToken()
│   ├── login.service.ts            # Password auth REST calls
│   ├── oauth.service.ts            # OAuth/Hydra consent
│   ├── saml.service.ts             # SAML/SSO: checkDomain(), ssoUrl(), getToken() (temp token → AuthTokens)
│   ├── account-verification.service.ts  # Force-reauth for account deletion; reads last_verified_at from JWT
│   └── account-entry-context.service.ts # AccountEntryContextService — captures `from`/`app` query
│                                           params into localStorage (`ENTRY_CONTEXT`) when
│                                           entering `apps/admin`, so it can navigate back to whichever
│                                           app (`rao`/`platform`/`dashboard`) the user came from
├── config/
│   ├── app.init.service.ts         # Loads app-config.json; inits Sentry + CDN scripts
│   ├── backend-config.service.ts   # Typed accessors over loaded config
│   └── stf-config.module.ts        # NgModule — call .forRoot(environment) in app root
├── filter-expression-modal/        # FilterExpressionModalComponent (+ add-filter-modal, filter-value) — builds And/Or/Not
│                                      filter expressions incl. key-value filters (reads schemas from KvSchemasService)
├── label/
│   ├── labels.service.ts           # Reactive label-set cache for current KB
│   ├── label.model.ts              # ColoredLabel (Classification + color)
│   └── label-sets/, label-*/       # Label-set management UI + label dropdown/field/list components
├── models/                         # Shared models (account, billing, ner.model.ts, …)
├── notifications/
│   └── notification.service.ts     # SSE/WebSocket notification aggregator for current KB
├── resources/                      # Resource list + edit state (UI components live in `libs/common`)
│   ├── resource-list.service.ts    # ★ ResourceListService — paginated/filterable catalog list state (see below)
│   ├── resource-list.model.ts      # ResourceListParams, searchResources(), BulkAction, RESOURCE_LIST_PREFERENCES
│   ├── resource-navigation.service.ts # Previous/next navigation between resources, fed by ResourceListService
│   ├── edit-resource.service.ts    # Per-resource edit state (fields, annotations, classifications)
│   └── edit-resource.helpers.ts    # Pure helpers: paragraph/entity annotations, label merge/removal
├── services/
│   ├── navigation.service.ts       # ★ URL builder + navigation helpers for all routes
│   ├── brand.service.ts            # BrandService — isPDP (Progress Data Platform) → logo/brand name/sign-up URL
│   ├── kv-schemas.service.ts       # KvSchemasService — KB key-value schemas cache (empty for ARAG)
│   ├── ner.service.ts              # NerService — entity families of the current KB
│   └── select-account-kb.service.ts # Account list loader
├── ui/
│   ├── sidebar.service.ts          # Sidebar instance registry (register/unregister/getSidebar)
│   ├── hint/                       # `ncom-hint` expandable hint component
│   ├── assume-role-modal/          # AssumeRoleModalComponent (AWS IAM policy guide, used by `libs/sync` and `apps/admin` account-models)
│   ├── pipes/                      # `size` pipe (file size), `FormatETAPipe` (processing ETA)
│   └── file-upload/
│       ├── file-drop.directive.ts  # [stfFileDrop] directive — drag-and-drop file handling (accepts file type specifiers)
│       └── file-drop.utils.ts      # getDroppedFiles() utility
├── upload/
│   ├── upload.service.ts           # ★ UploadService — file/link/text/Q&A uploads, status counts, bulkUpload()
│   ├── upload-event.service.ts     # Upload event bus
│   ├── upload.utils.ts             # File filtering/grouping, PENDING_RESOURCES_LIMIT
│   └── extraction-select/, resource-handling-banner/  # Upload UI components
├── unauthorized-feature/
│   ├── unauthorized-feature.directive.ts  # [stfUnauthorizedFeature] standalone directive
│   └── unauthorized-feature-modal.component.ts  # Standalone modal — shows tier-upgrade CTA with feature list + icons; navigates to billing
└── utils/
    ├── utils.ts                    # STFUtils (slugs, language lists), injectScript(), renderMarkdown(), isAbsoluteUrl()
    ├── safe-redirect.ts             # getSafeRedirectOrigin() — open-redirect guard: only allows https:
    │                                  (or http://localhost) origins sharing the backend's main domain
    ├── deep-equal.ts                # deepEqual() — deep object/array comparison
    ├── md5.ts                       # md5() — hashes a File for upload dedup
    └── clonedeep.ts                 # cloneDeep() — deep clone with circular-ref support
```

---

## SDKService — State Hub

**File:** `src/lib/api/sdk.service.ts`
Central source of truth for the currently active account/KB/ARAG. Application-level gateway to `@nuclia/core`.

**Key observables (read-only):**

| Observable         | Type                                | Description                                                       |
| ------------------ | ----------------------------------- | ----------------------------------------------------------------- |
| `currentAccount`   | `Observable<Account>`               | Currently selected account                                        |
| `currentKb`        | `Observable<WritableKnowledgeBox>`  | Auto-loaded when `_kb` + `_account` both emit                     |
| `currentArag`      | `Observable<RetrievalAgent>`        | Auto-loaded when `_arag` + `_account` both emit                   |
| `kbList`           | `Observable<IKnowledgeBoxItem[]>`   | All KBs for current account                                       |
| `aragList`         | `Observable<IRetrievalAgentItem[]>` | All ARAGs for current account                                     |
| `isAdminOrContrib` | `Observable<boolean>`               | True when the current KB or agent grants admin/contributor access |

**Key methods:** `setCurrentAccount(slug)`, `setCurrentKnowledgeBox(accountId, kbId, zone?, force?)`, `setCurrentRetrievalAgent(accountId, aragId, zone?, force?)`, `refreshKbList()`, `refreshAragList()`, `cleanAccount()`, `getOriginForApp(prefix)` (builds another first-party app's origin — `rag`/`rao`/`admin`/`platform` — by swapping the subdomain prefix; used by `NavigationService` for cross-app links).

---

## FeaturesService — Feature Flags

**File:** `src/lib/analytics/features.service.ts`

High-level service combining `FeatureFlagService` (CDN MD5 rollout) with account-type rules. Exposes named `Observable<boolean>` properties:

- **Roles:** `isKbAdmin`, `isKBContrib`, `isAragAdmin`, `isAccountManager`, `isTrial`, `isEnterpriseOrPro`
- **`unstable.*`** (hidden in prod, enabled per-account via MD5): `billing`, `retrievalAgents`, `modelManagement`, `routing`, `aragWithMemory`, `bedrockIntegration`, `cloudSyncService`, `raoWidget`, `progressComSignup`, `andOrFilterLogic`, `contextBoxNoTrial` (see BillingService), and others
- **`authorized.*`** (visible but tier-gated): `promptLab`, `summarization`, `remiMetrics`, `ragImages`, `extractConfig`, `splitConfig`, and others. `authorized.nuaKeys` is computed from the account instead of a flag: false for trial accounts (`trial_expiration_date` set or type `stash-trial`), which hides NUA key UI.

---

## BillingService — Context Box payment flow

**File:** `src/lib/api/billing.service.ts`

- `isContextBoxActivation` — true when the current account is a Context Box account (`workflow === 'cowork'` or `type === 'cowork'`) **and** `hasSubscription()` is false. A failed subscription lookup (other than 404) resolves to `false` so the user is never locked out by an API error.
- `isContextBoxPaymentRequired` — `isContextBoxActivation && features.unstable.contextBoxNoTrial`: the activation page must not be leavable. Consumed by `apps/admin` billing/checkout components.
- `hasSubscription()` — `GET /billing/account/:id/subscription`; a 404 means "no subscription" (`false`), any other error is rethrown.

---

## NavigationService — URL Builder

**File:** `src/lib/services/navigation.service.ts`

Never hard-code route paths in components. Use `NavigationService`:

| Method                                 | Path produced                                                                                                            |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `getAccountUrl(slug)`                  | `/at/:slug`                                                                                                              |
| `getKbUrl(account, kb)`                | `/at/:account/:zone/:kb` — cross-origin to `rag`'s origin when called from `admin`                                       |
| `getRetrievalAgentUrl(account, agent)` | `/at/:account/:zone/arag/:agent` — cross-origin to `rao`'s origin when called from `admin`                               |
| `getKbSelectUrl(account)`              | `/select/:account` — cross-origin to `rag`'s origin when called from `admin`                                             |
| `getKbManageUrl(account, kb)`          | `.../manage`                                                                                                             |
| `getAragSessionsUrl(account, agent)`   | `.../sessions`                                                                                                           |
| `getResourceListUrl()`                 | `Observable<string>` — `<kbUrl>/data/resources` of the current account/KB (`''` when the KB has no slug)                 |
| `getResourcePreviewUrl(acc, kb, id)`   | `<kbUrl>/data/resources/:id/edit/preview`                                                                                |
| `getSearchUrl()`                       | `Observable<string>` — `<kbUrl>/search` of the current account/KB (no arguments)                                         |
| `getAccountManageUrl(account)`         | `/at/:account` when called from within `admin` itself; otherwise `<admin origin>/at/:account` (cross-origin) — see below |
| `getBillingUrl(account)`               | `${getAccountManageUrl(account)}/billing`                                                                                |
| `getUpgradeUrl(account)`               | `${getBillingUrl(account)}/subscriptions`                                                                                |
| `getKbCreationUrl(account)`            | `${getAccountManageUrl(account)}/kbs/create`                                                                             |
| `getAragCreationUrl(account)`          | `${getAccountManageUrl(account)}/arag`                                                                                   |
| `goToLandingPage()`                    | navigates to pre-auth destination or `/select`                                                                           |
| `resetState()`                         | clears SDK state + navigates to `/select`                                                                                |

Reactive helpers: `homeUrl`, `kbUrl`, `isOnKbHome$` (true when the current path, query/hash stripped, equals `kbUrl`), `inArag()`, `inKbSettings()`.

`simpleMode` — `BehaviorSubject<boolean>` (default `false`). When `true`, `kbUrl` appends `/simple` to the KB URL. Set via `setSimpleMode(value: boolean)`. Read by `simpleModeGuard` in `libs/common` to auto-redirect the KB home page.

### Cross-app navigation (`admin` app)

Account-management pages live on their own app (`apps/admin`), so several `NavigationService` members exist purely to bridge across app origins:

- **`inAdminApp`** (`boolean`) — `environment.client === 'admin'`. Used throughout the service to flip a path between "local route" and "build a URL on another app's origin".
- **`fromApp(app)`** / private `resolvedFromApp` — which app (`'rao' | 'platform' | 'dashboard'`) the current session is considered to have entered from; inside `admin` this is read from `AccountEntryContextService`, elsewhere it's just the app's own `environment.client`. There is **no** `effectiveClient` property/method — use `fromApp()`.
- **`getAccountManageUrl(accountSlug)`** — the building block for every account-management URL. From within `admin` it's just `getAccountUrl(slug)` (no `/manage` segment — `admin` mounts `AccountModule` directly at `/at/:account`). From `dashboard`/`rao` it prefixes the admin app's origin via `getAdminOrigin()` (`backendConfig.getAdminOrigin()` for local dev, else `sdk.getOriginForApp('admin')`; also public, e.g. for building `/user/set-password` links).
- **`navigateExternal(url, { queryParams?, withFromApp? })`** — does a real `window.location.href` navigation for absolute URLs (appending `from`/`app` query params when `withFromApp` is true, so `AccountEntryContextService` can capture where the user came from), or an Angular router navigation for relative URLs.
- **`resolveGuardRedirect(url, config)`** — the `CanActivate`-friendly version of `navigateExternal()`: for a cross-origin `url` it triggers the external navigation and returns `false`; for a same-origin `url` it returns a `UrlTree` like a normal guard redirect. Used by `redirectToAdminGuard` and `selectKbGuard` in `libs/common`.

---

## Guards

Most guards live in `libs/common/src/lib/guards/`; `authGuard` and `redirectToSignUp` are defined in this lib (`src/lib/auth/auth.guard.ts`). All are wired into app routing via `@flaps/core`:

| Guard                          | Enforces                                                                                                                                                                                                                                                                      |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `authGuard` (in `core`)        | Checks `localStorage['JWT_KEY']` or `?token=` query param; also captures `?signup_token=`. A URL with both `?saml_ref=` and `?nonce=` (SAML IdP-initiated login) is never let through on an existing session/token — it falls through to the `/user/login-redirect` redirect. |
| `setAccountGuard`              | Calls `SDKService.setCurrentAccount()` from route param                                                                                                                                                                                                                       |
| `setKbGuard`                   | Calls `SDKService.setCurrentKnowledgeBox()` from route params                                                                                                                                                                                                                 |
| `setAgentGuard`                | Calls `SDKService.setCurrentRetrievalAgent()` from route params                                                                                                                                                                                                               |
| `accountOwnerGuard`            | Account-owner role required                                                                                                                                                                                                                                                   |
| `knowledgeBoxOwnerGuard`       | KB owner (SOWNER) required                                                                                                                                                                                                                                                    |
| `aragOwnerGuard`               | ARAG owner required                                                                                                                                                                                                                                                           |
| `selectAccountGuard`           | Redirects if account already selected                                                                                                                                                                                                                                         |
| `agentFeatureEnabledGuard`     | Checks `FeaturesService.unstable.retrievalAgents`                                                                                                                                                                                                                             |
| `redirectToSignUp` (in `core`) | `CanActivateFn` — sets `location.href` to `https://www.progress.com/agentic-rag/free-trial-sign-up` and returns `false`. Used on `/user/signup` in rao; signup itself is not part of this monorepo.                                                                           |

---

## Conventions & Gotchas

1. **`AppInitService` reads `assets/deployment/app-config.json`** — must exist in the app's assets before serving. Loaded via Angular `APP_INITIALIZER` inside `STFConfigModule.forRoot()`.

2. **`JWT_KEY` is the magic localStorage key** — `authGuard` checks `localStorage['JWT_KEY']`. Managed externally by `@nuclia/core` auth module.

3. **OnPush everywhere** — all generated components default to `ChangeDetectionStrategy.OnPush`. Use `async` pipe or explicit `markForCheck()`.

4. **Zone/region in URLs** — KB and ARAG URLs include the active zone, stored on `SDKService.nuclia.options.zone`.

5. **Testing stubs** — use `subscriptionFn` / `subscriptionPipeFn` from `@flaps/core` testing exports to mock observable-returning services without importing RxJS subjects directly.

6. **`UserService.updateWelcome()` only logs out on a 401** — other `/db/welcome` errors (e.g. network failures during OAuth redirects) are swallowed via `EMPTY` and do not affect the session, to avoid spurious logout loops (see #2728).

7. **`authGuard` captures `signup_token`** — if `?signup_token=` is in the URL, it is stored via `AuthService.setSignUpToken()` before the guard allows navigation. This token is later read by `OnboardingService` to pre-fill sign-up data.

8. **Account-deletion reauth is per account** — `AccountVerificationService.forceReauth(returnUrl, accountId)` stores `{ [accountId]: Date.now() }` as JSON under localStorage `PENDING_ACCOUNTS_DELETE` (exported const `PENDING_ACCOUNT_DELETE_KEY`), then redirects to OAuth with `prompt=login&max_age=0`. `hasPendingDelete(accountId)` / `clearPendingDelete(accountId)` take the account id; entries expire after 5 minutes. After returning, callers also check `isRecentlyVerified()` (JWT `last_verified_at` within 5 minutes) before showing the delete confirmation.

9. **`ResourceListService` is a root singleton with page-level state** — call `clear()` before `setStatus()` (the list component does this on each status-tab change) so `_ready`, filters, query, sort and page reset. `loading` stays true until both the first data load and `updateStatusCount()` have resolved (avoids flashing the empty-KB state). `hasLabels` is true only when at least one resource label set has labels. With `status === PENDING` it loads the catalog first, then merges `/processing-status` (rank/ETA) into the rows because processing-status alone does not return every pending resource. Each catalog load publishes `ResourceNavigationService.navigationData` so the resource viewer's previous/next follows the current list. `getAllResources()` pages the catalog 200 at a time and reports `incomplete` if any page errored. Selected columns persist in localStorage `NUCLIA_RESOURCE_LIST_PREFERENCES`. Bulk deletion itself is in `libs/common` (resources table) and calls the SDK's `WritableKnowledgeBox.deleteAllResources()`; `BulkAction` here is only the progress model.

10. **`UploadService.bulkUpload()`** runs up to 6 uploads concurrently, delays each by 10 s when more than `PENDING_RESOURCES_LIMIT` (900) uploads are queued, and blocks tab close (`beforeunload`) while running. Errors are counted, not thrown: 429/402/409 statuses are mapped to the rate-limit / blocked / conflict outcomes passed to `onUploadComplete`.
