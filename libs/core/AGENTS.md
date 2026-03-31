# AGENTS.md — `libs/core` (`@flaps/core`)

**Import path:** `@flaps/core` | **Nx project:** `core` | **Selector prefix:** `stf`

Shared Angular foundation library consumed by every first-party app (`dashboard`, `manager-v2`, `nucliadb-admin`, `rao`). No separate build target — transpiled as part of the consuming app.

Provides: SDK wrapper (`SDKService`), bootstrap config, auth flows, feature flags, navigation URL builder, billing API client, label management, real-time notifications, and shared UI utilities.

---

## Run Commands

```bash
nx test core    # Jest (no build / lint targets)
```

---

## Project Structure

```
libs/core/src/lib/
├── analytics/
│   ├── analytics.service.ts        # GTM dataLayer pushes
│   ├── feature-flag.service.ts     # CDN-driven feature flags (low-level MD5 rollout)
│   └── features.service.ts         # Permission/tier-aware feature flags (high-level)
├── api/
│   ├── sdk.service.ts              # ★ SDKService — central SDK wrapper & reactive state hub
│   ├── billing.service.ts          # Stripe/AWS/Manual billing API client
│   ├── sso.service.ts              # SSO login URL builder (Google/GitHub/Microsoft); reauth URL
│   ├── user.service.ts             # Current user info
│   └── zone.service.ts             # Available deployment zones
├── auth/
│   ├── auth.guard.ts               # authGuard (functional) — checks JWT_KEY or ?token= or ?signup_token=
│   ├── auth.service.ts             # Stores pre-login redirect URL in localStorage; setSignUpToken()
│   ├── login.service.ts            # Password auth REST calls
│   ├── metrics.guards.ts           # metricsEnabledGuard / metricsDisabledGuard (CanMatchFn)
│   ├── oauth.service.ts            # OAuth/Hydra consent
│   ├── saml.service.ts             # SAML/SSO token exchange
│   └── account-verification.service.ts  # Force-reauth support; reads last_verified_at from JWT
├── config/
│   ├── app.init.service.ts         # Loads app-config.json; inits Sentry + CDN scripts
│   ├── backend-config.service.ts   # Typed accessors over loaded config
│   └── stf-config.module.ts        # NgModule — call .forRoot(environment) in app root
├── label/
│   └── labels.service.ts           # Reactive label-set cache for current KB
├── notifications/
│   └── notification.service.ts     # SSE/WebSocket notification aggregator for current KB
├── services/
│   ├── navigation.service.ts       # ★ URL builder + navigation helpers for all routes
│   └── select-account-kb.service.ts # Account list loader
├── ui/
│   ├── sidebar.service.ts          # Sidebar instance registry
│   └── pipes/size.pipe.ts          # Human-readable file size (`size` pipe)
├── unauthorized-feature/
│   └── unauthorized-feature.directive.ts  # [stfUnauthorizedFeature] standalone directive
└── utils/
    └── utils.ts                    # STFUtils, injectScript(), deepEqual(), MD5, countries
```

---

## SDKService — State Hub

**File:** `src/lib/api/sdk.service.ts`
Central source of truth for the currently active account/KB/ARAG. Application-level gateway to `@nuclia/core`.

**Key observables (read-only):**

| Observable | Type | Description |
|---|---|---|
| `currentAccount` | `Observable<Account>` | Currently selected account |
| `currentKb` | `Observable<WritableKnowledgeBox>` | Auto-loaded when `_kb` + `_account` both emit |
| `currentArag` | `Observable<RetrievalAgent>` | Auto-loaded when `_arag` + `_account` both emit |
| `kbList` | `Observable<IKnowledgeBoxItem[]>` | All KBs for current account |
| `aragList` | `Observable<IRetrievalAgentItem[]>` | All ARAGs for current account |
| `isAdminOrContrib` | `Observable<boolean>` | True in standalone mode or admin/contrib role |

**Key methods:** `setCurrentAccount(slug)`, `setCurrentKb(accountId, kbId, zone?)`, `setCurrentRetrievalAgent(...)`, `refreshKbList()`, `refreshAragList()`, `cleanAccount()`

---

## FeaturesService — Feature Flags

**File:** `src/lib/analytics/features.service.ts`

High-level service combining `FeatureFlagService` (CDN MD5 rollout) with account-type rules. Exposes named `Observable<boolean>` properties:

- **Roles:** `isKbAdmin`, `isKBContrib`, `isAragAdmin`, `isAccountManager`, `isTrial`, `isEnterpriseOrPro`
- **`unstable.*`** (hidden in prod, enabled per-account via MD5): `billing`, `retrievalAgents`, `modelManagement`, `routing`, `aragWithMemory`, `bedrockIntegration`, `cloudSyncService`, `raoWidget`, `progressComSignup`, `simpleUI`, `metrics`, and others
- **`authorized.*`** (visible but tier-gated): `promptLab`, `summarization`, `remiMetrics`, `ragImages`, `extractConfig`, `splitConfig`, and others

---

## NavigationService — URL Builder

**File:** `src/lib/services/navigation.service.ts`

Never hard-code route paths in components. Use `NavigationService`:

| Method | Path produced |
|---|---|
| `getAccountUrl(slug)` | `/at/:slug` |
| `getKbUrl(account, kb)` | `/at/:account/:zone/:kb` (omits zone in standalone) |
| `getRetrievalAgentUrl(account, agent)` | `/at/:account/:zone/arag/:agent` |
| `getKbManageUrl(account, kb)` | `.../manage` |
| `getAragSessionsUrl(account, agent)` | `.../sessions` |
| `getBillingUrl(account)` | `/at/:account/manage/billing` |
| `goToLandingPage()` | navigates to pre-auth destination or `/select` |
| `resetState()` | clears SDK state + navigates to `/select` |

Reactive helpers: `homeUrl`, `kbUrl`, `inArag()`, `inKbSettings()`.

---

## Guards (from `@flaps/common`)

Most guards live in `libs/common/src/lib/guards/`. Imported and wired in app routing:

| Guard | Enforces |
|---|---|
| `authGuard` | Checks `localStorage['JWT_KEY']` or `?token=` query param; also captures `?signup_token=` |
| `setAccountGuard` | Calls `SDKService.setCurrentAccount()` from route param |
| `setKbGuard` | Calls `SDKService.setCurrentKb()` from route params |
| `setAgentGuard` | Calls `SDKService.setCurrentRetrievalAgent()` from route params |
| `accountOwnerGuard` | Account-owner role required |
| `knowledgeBoxOwnerGuard` | KB owner (SOWNER) required |
| `aragOwnerGuard` | ARAG owner required |
| `selectAccountGuard` | Redirects if account already selected |
| `agentFeatureEnabledGuard` | Checks `FeaturesService.unstable.retrievalAgents` |
| `metricsEnabledGuard` | `canMatch` — true when `FeaturesService.unstable.metrics` is on (in `@flaps/core`) |
| `metricsDisabledGuard` | `canMatch` — true when `FeaturesService.unstable.metrics` is off (in `@flaps/core`) |

---

## Conventions & Gotchas

1. **`AppInitService` reads `assets/deployment/app-config.json`** — must exist in the app's assets before serving. Loaded via Angular `APP_INITIALIZER` inside `STFConfigModule.forRoot()`.

2. **`JWT_KEY` is the magic localStorage key** — `authGuard` checks `localStorage['JWT_KEY']`. Managed externally by `@nuclia/core` auth module.

3. **Standalone mode** (`staticEnvironmentConfiguration.standalone = true`):
   - `SDKService.setCurrentAccount()` returns `standaloneSimpleAccount` instead of a network call
   - `NavigationService` omits zone from KB URLs
   - `UserService` skips `getWelcome()`

4. **OnPush everywhere** — all generated components default to `ChangeDetectionStrategy.OnPush`. Use `async` pipe or explicit `markForCheck()`.

5. **Zone/region in URLs** — zone is always included in non-standalone KB/ARAG URLs. Active zone stored on `SDKService.nuclia.options.zone`.

6. **Testing stubs** — use `subscriptionFn` / `subscriptionPipeFn` from `@flaps/core` testing exports to mock observable-returning services without importing RxJS subjects directly.

7. **`UserService.updateWelcome()` logs out on any error** — previously only 403/400 triggered logout; now any `/db/welcome` error does. If the current tokens are invalid, users are redirected to login immediately.

8. **`authGuard` captures `signup_token`** — if `?signup_token=` is in the URL, it is stored via `AuthService.setSignUpToken()` before the guard allows navigation. This token is later read by `OnboardingService` to pre-fill sign-up data.

9. **`metricsEnabledGuard` / `metricsDisabledGuard`** live in `libs/core/src/lib/auth/metrics.guards.ts` (not in `libs/common`). They are `CanMatchFn` guards, not `CanActivateFn`. Use them to serve two different route configurations for the same `/metrics` path.
