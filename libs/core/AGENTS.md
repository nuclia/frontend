# AGENTS.md — `libs/core` (`@flaps/core`)

**Import path:** `@flaps/core` | **Nx project:** `core` | **Selector prefix:** `stf`

Shared Angular foundation library consumed by every first-party app (`admin`, `dashboard`, `manager-v2`, `nucliadb-admin`, `rao`). No separate build target — transpiled as part of the consuming app.

Provides: SDK wrapper (`SDKService`), bootstrap config, auth flows, feature flags, navigation URL builder, billing API client, label management, real-time notifications, analytics (GTM + Pendo), and shared UI utilities.

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
│   ├── features.service.ts         # Permission/tier-aware feature flags (high-level)
│   └── pendo.service.ts            # Feeds visitor/account metadata to Pendo (prod-only; see each
│                                      app's index.html for the loader script). Moved here from
│                                      `apps/dashboard` so `apps/admin` can reuse it too.
├── api/
│   ├── sdk.service.ts              # ★ SDKService — central SDK wrapper & reactive state hub
│   ├── billing.service.ts          # Stripe/AWS/Manual/Cloud Zero billing API client — incl. `getTrialTokenUsage()`
│   ├── bedrock.service.ts          # AWS Bedrock assume-role auth flow (start/finish/delete)
│   ├── sso.service.ts              # SSO login URL builder + code exchange (Google/GitHub/Microsoft)
│   ├── user.service.ts             # Current user info
│   └── zone.service.ts             # Available deployment zones
├── auth/
│   ├── auth.guard.ts               # authGuard (functional) — checks JWT_KEY or ?token= or ?signup_token=
│   ├── auth.service.ts             # Stores pre-login redirect URL in localStorage; setSignUpToken()
│   ├── login.service.ts            # Password auth REST calls
│   ├── oauth.service.ts            # OAuth/Hydra consent
│   ├── saml.service.ts             # SAML/SSO token exchange
│   ├── account-verification.service.ts  # Force-reauth support; reads last_verified_at from JWT
│   └── account-entry-context.service.ts # AccountEntryContextService — captures `from`/`app` query
│                                           params into localStorage (`ACCOUNT_APP_ENTRY_CONTEXT`) when
│                                           entering `apps/admin`, so it can navigate back to whichever
│                                           app (`rao`/`platform`/`dashboard`) the user came from
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
│   ├── sidebar.service.ts          # Sidebar instance registry (register/unregister/getSidebar)
│   ├── pipes/size.pipe.ts          # Human-readable file size (`size` pipe)
│   └── file-upload/
│       ├── file-drop.directive.ts  # [stfFileDrop] directive — drag-and-drop file handling (accepts file type specifiers)
│       └── file-drop.utils.ts      # getDroppedFiles() utility
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

| Observable         | Type                                | Description                                     |
| ------------------ | ----------------------------------- | ----------------------------------------------- |
| `currentAccount`   | `Observable<Account>`               | Currently selected account                      |
| `currentKb`        | `Observable<WritableKnowledgeBox>`  | Auto-loaded when `_kb` + `_account` both emit   |
| `currentArag`      | `Observable<RetrievalAgent>`        | Auto-loaded when `_arag` + `_account` both emit |
| `kbList`           | `Observable<IKnowledgeBoxItem[]>`   | All KBs for current account                     |
| `aragList`         | `Observable<IRetrievalAgentItem[]>` | All ARAGs for current account                   |
| `isAdminOrContrib` | `Observable<boolean>`               | True in standalone mode or admin/contrib role   |

**Key methods:** `setCurrentAccount(slug)`, `setCurrentKnowledgeBox(accountId, kbId, zone?, force?)`, `setCurrentRetrievalAgent(accountId, aragId, zone?, force?)`, `refreshKbList()`, `refreshAragList()`, `cleanAccount()`, `getOriginForApp(prefix)` (builds another first-party app's origin — `rag`/`rao`/`admin`/`platform` — by swapping the subdomain prefix; used by `NavigationService` for cross-app links).

---

## FeaturesService — Feature Flags

**File:** `src/lib/analytics/features.service.ts`

High-level service combining `FeatureFlagService` (CDN MD5 rollout) with account-type rules. Exposes named `Observable<boolean>` properties:

- **Roles:** `isKbAdmin`, `isKBContrib`, `isAragAdmin`, `isAccountManager`, `isTrial`, `isEnterpriseOrPro`
- **`unstable.*`** (hidden in prod, enabled per-account via MD5): `billing`, `retrievalAgents`, `modelManagement`, `routing`, `aragWithMemory`, `bedrockIntegration`, `cloudSyncService`, `raoWidget`, `progressComSignup`, `andOrFilterLogic`, and others
- **`authorized.*`** (visible but tier-gated): `promptLab`, `summarization`, `remiMetrics`, `ragImages`, `extractConfig`, `splitConfig`, and others

---

## NavigationService — URL Builder

**File:** `src/lib/services/navigation.service.ts`

Never hard-code route paths in components. Use `NavigationService`:

| Method                                 | Path produced                                                                                                            |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `getAccountUrl(slug)`                  | `/at/:slug`                                                                                                              |
| `getKbUrl(account, kb)`                | `/at/:account/:zone/:kb` (omits zone in standalone) — cross-origin to `rag`'s origin when called from `admin`            |
| `getRetrievalAgentUrl(account, agent)` | `/at/:account/:zone/arag/:agent` — cross-origin to `rao`'s origin when called from `admin`                               |
| `getKbSelectUrl(account)`              | `/select/:account` — cross-origin to `rag`'s origin when called from `admin`                                             |
| `getKbManageUrl(account, kb)`          | `.../manage`                                                                                                             |
| `getAragSessionsUrl(account, agent)`   | `.../sessions`                                                                                                           |
| `getAccountManageUrl(account)`         | `/at/:account` when called from within `admin` itself; otherwise `<admin origin>/at/:account` (cross-origin) — see below |
| `getBillingUrl(account)`               | `${getAccountManageUrl(account)}/billing`                                                                                |
| `getUpgradeUrl(account)`               | `${getBillingUrl(account)}/subscriptions`                                                                                |
| `getKbCreationUrl(account)`            | `${getAccountManageUrl(account)}/kbs/create`                                                                             |
| `getAragCreationUrl(account)`          | `${getAccountManageUrl(account)}/arag`                                                                                   |
| `goToLandingPage()`                    | navigates to pre-auth destination or `/select`                                                                           |
| `resetState()`                         | clears SDK state + navigates to `/select`                                                                                |

Reactive helpers: `homeUrl`, `kbUrl`, `inArag()`, `inKbSettings()`.

`simpleMode` — `BehaviorSubject<boolean>` (default `false`). When `true`, `kbUrl` appends `/simple` to the KB URL. Set via `setSimpleMode(value: boolean)`. Read by `simpleModeGuard` in `libs/common` to auto-redirect the KB home page.

### Cross-app navigation (since the `admin` extraction)

Account-management pages now live on their own app (`apps/admin`), so several `NavigationService` members exist purely to bridge across app origins:

- **`inAdminApp`** (`boolean`) — `environment.client === 'admin'`. Used throughout the service to flip a path between "local route" and "build a URL on another app's origin".
- **`fromApp(app)`** / private `resolvedFromApp` — which app (`'rao' | 'platform' | 'dashboard'`) the current session is considered to have entered from; inside `admin` this is read from `AccountEntryContextService`, elsewhere it's just the app's own `environment.client`. There is **no** `effectiveClient` property/method — use `fromApp()`.
- **`getAccountManageUrl(accountSlug)`** — the building block for every account-management URL. From within `admin` it's just `getAccountUrl(slug)` (no `/manage` segment — `admin` mounts `AccountModule` directly at `/at/:account`). From `dashboard`/`rao` it prefixes the admin app's origin (`backendConfig.getAdminOrigin()` for local dev, else `sdk.getOriginForApp('admin')`).
- **`navigateExternal(url, { queryParams?, withFromApp? })`** — does a real `window.location.href` navigation for absolute URLs (appending `from`/`app` query params when `withFromApp` is true, so `AccountEntryContextService` can capture where the user came from), or an Angular router navigation for relative URLs.
- **`resolveGuardRedirect(url, config)`** — the `CanActivate`-friendly version of `navigateExternal()`: for a cross-origin `url` it triggers the external navigation and returns `false`; for a same-origin `url` it returns a `UrlTree` like a normal guard redirect. Used by `redirectToAdminGuard` and `selectKbGuard` in `libs/common`.

---

## Guards

Most guards live in `libs/common/src/lib/guards/`; `authGuard` and `redirectToSignUp` are defined in this lib (`src/lib/auth/auth.guard.ts`). All are wired into app routing via `@flaps/core`:

| Guard                          | Enforces                                                                                                                                                                                            |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `authGuard` (in `core`)        | Checks `localStorage['JWT_KEY']` or `?token=` query param; also captures `?signup_token=`                                                                                                           |
| `setAccountGuard`              | Calls `SDKService.setCurrentAccount()` from route param                                                                                                                                             |
| `setKbGuard`                   | Calls `SDKService.setCurrentKnowledgeBox()` from route params                                                                                                                                       |
| `setAgentGuard`                | Calls `SDKService.setCurrentRetrievalAgent()` from route params                                                                                                                                     |
| `accountOwnerGuard`            | Account-owner role required                                                                                                                                                                         |
| `knowledgeBoxOwnerGuard`       | KB owner (SOWNER) required                                                                                                                                                                          |
| `aragOwnerGuard`               | ARAG owner required                                                                                                                                                                                 |
| `selectAccountGuard`           | Redirects if account already selected                                                                                                                                                               |
| `agentFeatureEnabledGuard`     | Checks `FeaturesService.unstable.retrievalAgents`                                                                                                                                                   |
| `redirectToSignUp` (in `core`) | `CanActivateFn` — sets `location.href` to `https://www.progress.com/agentic-rag/free-trial-sign-up` and returns `false`. Used on `/user/signup` in rao; signup itself is not part of this monorepo. |

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

7. **`UserService.updateWelcome()` only logs out on a 401** — other `/db/welcome` errors (e.g. network failures during OAuth redirects) are swallowed via `EMPTY` and do not affect the session, to avoid spurious logout loops (see #2728).

8. **`authGuard` captures `signup_token`** — if `?signup_token=` is in the URL, it is stored via `AuthService.setSignUpToken()` before the guard allows navigation. This token is later read by `OnboardingService` to pre-fill sign-up data.
