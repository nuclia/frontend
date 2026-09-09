# AGENTS.md — `admin` app

Angular 21 app that hosts all account-management pages (`/at/:account/**`) as their own
standalone app/subdomain, separate from `dashboard` — the same pattern `apps/auth` uses for
login/signup.

Nx project name: **admin**. Selector prefix: **app-**.

---

## Purpose

Previously, account-management pages (billing, members, API keys, account deletion, etc.) lived
inside `dashboard` under `/at/:account/manage/**`. They're being extracted into this standalone
`admin` app so that PDP Studio (and eventually other white-label surfaces) can reuse them without
pulling in the rest of the KB/ARAG dashboard. Links from the KB dashboard into account pages are
real navigations (`<a>`/`window.location.href`), not Angular routing — `admin` is a separate
origin/subdomain, same pattern as `dashboard`/`rao`/`platform`/`auth`.

---

## Run Commands

```bash
nx serve admin -c local-stage    # Dev server against stage backend (Nuclia employees)
nx serve admin -c local-prod     # Dev server against real prod backend, remoteLogin flow
nx build admin                   # Production build
nx test admin                    # Jest tests
```

---

## Architecture & Structure

```
apps/admin/src/
├── app/
│   ├── app.module.ts              # Root NgModule — mounts AccountModule + friends
│   ├── app.component.ts           # Root component — minimal shell (same as auth/dashboard)
│   ├── app-routing.module.ts      # Root routes (see below)
│   ├── app-title.strategy.ts      # Page title strategy
│   └── fallback-redirect.guard.ts # Catch-all: redirects unknown routes to dashboard
├── environments/
│   ├── environment.ts             # Dev: client='admin'
│   └── environment.prod.ts        # Prod: client='admin'
└── environments_config/
    ├── local-dev, local-stage, local-prod/app-config.json  # remoteLogin: true + each app's own
    │                                                          registered oauth.client_id
    └── production/app-config.json  # client_id injected via STF_DOCKER_CONFIG_OAUTH_CLIENT_ID
```

## Routing Tree (current)

```
/                          → BaseComponent (requires authGuard)
  /                        → EmptyComponent (rootGuard → redirects to /select or home)
  /redirect                → RedirectComponent (remoteLogin bounce-back target, local dev only)
  /at/:account             → DashboardLayoutComponent (requires captureEntryContextGuard,
                               setAccountGuard)
                             → AccountModule (lazy `loadChildren`, no `/manage` segment — routes
                               are shorter here than dashboard's `/at/:account/manage/...`).
                               EULA-modal gating is skipped here (see Gotchas below).
/select                    → SelectAccountComponent (requires authGuard + selectAccountGuard)
  /select/:account         → EmptyComponent (requires selectAccountManageGuard — trivial
                              redirect straight to the account-manage URL, no KB/zone picking)
/farewell                  → FarewellComponent (post account-deletion exit page)
/setup_account             → AwsOnboardingComponent (requires awsGuard)
/user/callback              → CallbackComponent
/user/login-redirect        → AppLoginComponent
/user/signup                → PageNotFoundComponent + redirectToSignUp guard (real signup lives
                               in the `auth` app)
/**                          → fallbackRedirectGuard → external redirect to dashboard, or 404
                                if cameFrom fails validation
```

---

## Guards

| Guard                      | From                 | What it enforces                                                                                                                                                                                                                                                                       |
| -------------------------- | -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `authGuard`                | `@flaps/core`        | User must be authenticated; redirects to `/user/login-redirect`.                                                                                                                                                                                                                       |
| `rootGuard`                | `@flaps/common`      | Redirects authenticated users to `/select` (or their configured landing page).                                                                                                                                                                                                         |
| `selectAccountGuard`       | `@flaps/common`      | 0 accounts → onboarding redirect; 1 account → auto-continue; several → show picker.                                                                                                                                                                                                    |
| `selectAccountManageGuard` | `@flaps/common`      | Trivial redirect from `/select/:account` straight to the account-manage URL (no KB/ARAG picker — `admin` has none).                                                                                                                                                                    |
| `captureEntryContextGuard` | `apps/admin` (local) | Reads `from`/`app` query params on `/at/:account` and persists them via `AccountEntryContextService` (`ACCOUNT_APP_ENTRY_CONTEXT` in localStorage) for later "back to workspace" navigation and `inRaoApp`/`inPlatformApp`/`inDashboard` faking. Never blocks — always returns `true`. |
| `setAccountGuard`          | `@flaps/common`      | Loads the account by slug from `/at/:account`, sets it as current in SDK state.                                                                                                                                                                                                        |
| `awsGuard`                 | `@flaps/common`      | Only allows access during AWS Marketplace onboarding flow.                                                                                                                                                                                                                             |
| `fallbackRedirectGuard`    | `apps/admin` (local) | Catch-all `**` route. Validates `cameFrom` via the shared `getSafeRedirectOrigin()` util (`@flaps/core`) before redirecting to dashboard; otherwise renders the 404 page.                                                                                                              |

---

## Environment Config

| Key      | Value     |
| -------- | --------- |
| `client` | `'admin'` |

Runtime config is loaded from `assets/deployment/app-config.json` at bootstrap (not baked in).
All configs (`local-dev`/`local-stage`/`local-prod`/`production`) set `remoteLogin: true` and
have their own registered `oauth.client_id` (a distinct UUID per environment, e.g.
`2a814d08-91de-4b36-89aa-0c19749cd5e1` for `local-dev`; `STF_DOCKER_CONFIG_OAUTH_CLIENT_ID` in
`production`) — `admin` does real Hydra OAuth like `dashboard`/`rao`/`platform`, with
`remoteLogin` kept as a faster local-testing shortcut (see Gotchas below).

---

## Gotchas

- **`remoteLogin` bounce-back is local-testing-only.** It relies on two shared-lib fixes in
  `libs/user` (`login.component.ts` using `window.location.origin` instead of a hardcoded port,
  and `redirect.component.ts`'s `AUTHORIZED_REDIRECTS` allowlist including this app's local port)
- **`AppComponent` must consume `access_token`/`refresh_token` from the URL.** `apps/admin` was
  scaffolded from `apps/auth`, which never needs this (it issues tokens, not receives them) — so
  the initial copy was missing the `remoteLogin()` method that `dashboard`/`rao`/`platform` all
  have. Without it, tokens appended to the URL by `/redirect` are never stored, `authGuard` never
  sees a JWT, and the user gets bounced to `/user/login-redirect` → a real OAuth attempt. Fixed by
  porting the same `remoteLogin()` method (gated by `config.useRemoteLogin()`) into
  `apps/admin/src/app/app.component.ts`.
- **`admin` now has its own Hydra `oauth.client_id`**, a distinct UUID registered in Hydra per
  environment (`local-dev`, `local-stage`, `local-prod`, `production` via
  `STF_DOCKER_CONFIG_OAUTH_CLIENT_ID`). This means a cold/direct visit (no token in the URL) also
  works: `authGuard` → `/user/login-redirect` →
  `AppLoginComponent` → `redirectToOAuth()` succeeds instead of throwing. `remoteLogin: true` is
  kept alongside it everywhere — it's what makes manually visiting the `auth` app's `/redirect?
redirect=http://localhost:PORT` page (after already being logged in there) bounce back with a
  token `admin` can consume, which is a faster local-testing loop than a full Hydra round-trip.
- **EULA gating is intentionally skipped here.** `DashboardLayoutComponent` normally forces a
  non-dismissable EULA modal for account managers; that's disabled when `navigation.inAdminApp`
  is true (whether PDP Studio end-users should be forced through Nuclia's own EULA is an
  unresolved legal/product question, deliberately not defaulted to "on").
- **Nothing left pending from the scaffold.** The entry-context capture/consumption mechanism
  and the full cross-app navigation conversion are both implemented:
  `AccountEntryContextService`, `captureEntryContextGuard`, `NavigationService.fromApp()`
  (there is no `effectiveClient` property — the private `resolvedFromApp` field backs `fromApp()`),
  `navigateExternal()`/`resolveGuardRedirect()`, the `backLink`/`nsi-back-button` external-href
  fixes, and every KB/ARAG "table inside a page" reverse-direction link (`kb-list`, `arag-list`,
  `account-home`, `account-consumption`, `account-users`, `invite-collaborators-modal`,
  `checkout`) now leave `admin` via a real navigation instead of Angular routing.
- **`environment.client` is a loose `string`**, not a TS union — `'admin'` is a valid value today
  only because nothing enforces the union. Some `NavigationService`/guard logic keyed off
  `environment.client` (`inRaoApp`/`inPlatformApp`/`inDashboard`) will need updating once
  RAO-account users can reach `admin`.
