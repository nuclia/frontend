# AGENTS.md — `auth` app

Angular 21 app that owns the entire authentication flow for the Nuclia platform.  
Nx project name: **auth**. Selector prefix: **app-**.

---

## Purpose

The `auth` app is a dedicated authentication host. It serves all login, signup, magic link,
SSO (Google / GitHub / Microsoft / SAML), OAuth callback, password recovery, and consent flows.
It is deployed as a standalone Angular app and receives callbacks from external identity providers.

---

## Run Commands

```bash
nx serve auth        # Dev server (default port)
nx build auth        # Production build
nx test auth         # Jest tests
```

---

## Architecture & Structure

```
apps/auth/src/
├── app/
│   ├── app.module.ts            # Root NgModule — HTTP interceptors, translate, toast
│   ├── app.component.ts         # Root component — minimal shell
│   ├── app-routing.module.ts    # Root routes (see below)
│   ├── app-title.strategy.ts    # Page title strategy
│   ├── fallback-redirect.guard.ts # Catch-all: redirects unknown routes to rag app
│   └── lazy-user.module.ts      # Lazy loader for @nuclia/user authRoutes
├── environments/
│   ├── environment.ts           # Dev: client='rao', social_login=true
│   └── environment.prod.ts      # Prod: client='auth', social_login=true
└── assets/
    ├── i18n/                    # Translations (inherits from @nuclia/user)
    └── deployment/              # Runtime app-config.json (injected at deploy time)
```

## Routing Tree

The root app owns the shell and delegates all auth pages to `@nuclia/user` via a lazy module:

```
/                         → BaseComponent (requires authGuard)
  /                       → EmptyComponent (rootGuard → redirects authenticated users)
  /redirect               → RedirectComponent
/feedback                 → FeedbackComponent (requires authGuard)
/farewell                 → FarewellComponent
/setup/invite             → InviteComponent (requires authGuard)
/setup_account            → AwsOnboardingComponent (requires awsGuard)
/user/*                   → LazyUserModule (loads authRoutes from @nuclia/user)
  /user/callback          → CallbackComponent
  /user/callbacks/saml    → CallbackComponent (data: { saml: true })
  /user/callbacks/google  → CallbackComponent (data: { google: true })
  /user/callbacks/github  → CallbackComponent (data: { github: true })
  /user/callbacks/microsoft → CallbackComponent (data: { microsoft: true })
  /user/login             → LoginComponent (resolve: loginResolver)
  /user/recover           → RecoverComponent
  /user/reset             → ResetComponent
  /user/setup             → ResetComponent (same component as reset)
  /user/magic             → MagicComponent
  /user/join              → MagicComponent (same component)
  /user/signup            → SignupComponent
  /user/check-mail        → CheckMailComponent
  /user/consent           → ConsentComponent (resolve: consentResolver)
/**                   → fallbackRedirectGuard → external redirect to rag app, or 404 if cameFrom fails validation
```

**Important:** All auth pages live under `/user/*` and are implemented in `libs/user`, not in
this app. Never add auth logic directly to `apps/auth/src` — it belongs in `libs/user`.

---

## Guards

| Guard                   | From                | What it enforces                                                                                                                                                                                                                          |
| ----------------------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `authGuard`             | `@flaps/core`       | User must be authenticated; redirects to `/user/login` if not                                                                                                                                                                             |
| `rootGuard`             | `@flaps/common`     | Redirects authenticated users to their home dashboard                                                                                                                                                                                     |
| `awsGuard`              | `@flaps/common`     | Only allows access during AWS Marketplace onboarding flow                                                                                                                                                                                 |
| `fallbackRedirectGuard` | `apps/auth` (local) | Catches ALL unmatched routes (`**`). Validates `cameFrom` via `getSafeOrigin()` (must be https + same main domain as backend). If valid, redirects to rag app preserving path + query. If invalid, returns `true` and shows the 404 page. |

---

## Key Dependencies

| Alias                              | Purpose in this app                                                         |
| ---------------------------------- | --------------------------------------------------------------------------- |
| `@nuclia/user`                     | Provides `AuthUserModule`, `authRoutes`, and all auth UI components         |
| `@flaps/core`                      | Provides `authGuard`, `BackendConfigurationService`, HTTP interceptors      |
| `@flaps/common`                    | Provides `BaseComponent`, `rootGuard`, `awsGuard`, `AwsOnboardingComponent` |
| `@nuclia/sistema`                  | Design tokens, password input                                               |
| `@guillotinaweb/pastanaga-angular` | Base UI: buttons, toast, icons, text fields                                 |

---

## State & Auth Flow

This app has **no local state**. Auth state is managed entirely inside `@flaps/core` services
and `@nuclia/user` components. The app is a pure routing host.

OAuth callbacks land at `/user/callback` (or `/user/callbacks/<provider>` for named providers).
The `CallbackComponent` in `@nuclia/user` handles token exchange and redirect after auth.

SAML flows have two paths:

- Legacy: goes through the standard `/user/callback` path
- New: goes through `/user/callbacks/saml`
  Both are supported simultaneously during the migration period.

---

## Environment Config

| Key                    | Dev value | Prod value |
| ---------------------- | --------- | ---------- |
| `client`               | `'rao'`   | `'auth'`   |
| `backend.social_login` | `true`    | `true`     |
| `backend.new_api`      | `true`    | `true`     |

Runtime config is loaded from `assets/deployment/app-config.json` at bootstrap (not baked in).
The `BackendConfigurationService` from `@flaps/core` reads this config.

---

## Testing

Runner: Jest 30 (`jest-preset-angular`). Tests are in `libs/user` (not in `apps/auth`).

```bash
nx test auth        # app-level tests (minimal — just bootstrapping)
nx test user        # all auth flow tests live here
```

---

## Gotchas

- **Auth pages are not in this app.** They live in `libs/user/src/lib/`. If you need to add or
  change a login/signup/callback flow, work in `libs/user`, not here.
- **The `**`wildcard redirects to the rag app, not a 404 page — unless`cameFrom`fails validation.** The auth app uses a`fallbackRedirectGuard`on the catch-all route that normally redirects unmatched URLs to the rag app
(via`OAuthService.getCameFrom()`) preserving the full path and query parameters. This
prevents dead-end 404 pages for routes like `/select`, `/user/login-redirect`,
`/user/onboarding`, `/at/:account/...`, or any other route that shared libs navigate to but
only exists in the dashboard/rao apps. **Security:** `cameFrom`is validated via`getSafeOrigin()`—
it must be`https:`(or`http://localhost`) and share the same main domain as the backend API. If
validation fails, the guard returns `true`, allowing `PageNotFoundComponent` to render rather than
  guessing an unsafe redirect target. So the 404 page CAN render in this one error case.
- **`came_from` can equal the auth app's own origin.** When the OAuth flow is initiated from
  the auth app itself (e.g. after logout + re-auth), `redirectToOAuth()` sets
  `came_from = window.location.origin` (auth.progress.cloud). On callback, the check
  `came_from !== window.location.origin` fails, so the callback navigates to `/` instead of
  redirecting externally. This triggers `rootGuard` → `goToLandingPage()` → `/select`.
  The `fallbackRedirectGuard` breaks this loop by redirecting to the rag app.
- **`/user/reset` and `/user/setup` are the same component.** `ResetComponent` handles both
  "set new password via reset link" and "set password during invite onboarding" — they use the
  same URL pattern with different query strings.
- **`/user/magic` and `/user/join` are the same component.** `MagicComponent` handles both
  magic-link login and team-join flows.
- **Two SAML callback paths exist.** Both `/user/callback` (with no data) and
  `/user/callbacks/saml` (with `data: { saml: true }`) route to `CallbackComponent`. This is
  intentional for backward compatibility during migration — do not remove the legacy path.
- **The `came_from` parameter** is threaded through the entire OAuth flow (including SAML and
  signup) so the user is redirected back to their original URL after auth. It is stored in the
  OAuth `state` parameter. Do not break the `came_from` → `state` encoding in `CallbackComponent`.
- **`login_challenge`** is included in signup flows to support OAuth-initiated signups (Hydra
  login flows). It must be forwarded through the signup form.
