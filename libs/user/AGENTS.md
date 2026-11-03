# AGENTS.md — `libs/user`

## Library Overview

`libs/user` is an Angular feature library encapsulating all **user-facing auth, identity, and account-setup flows** shared across Nuclia frontend apps.

Exposes:

- `AuthUserModule` + `authRoutes` — the core OAuth/login/signup flow, self-contained NgModule + route array. Only `apps/auth` loads this (via a `LazyUserModule` wrapper).
- Standalone components re-exported individually — every other consuming app wires these directly into its own routes instead of loading the module.

Handles: email/password login+signup, password recovery+reset, magic-link, SSO (Google/GitHub/Microsoft), SAML (including IdP-initiated handoff), OAuth 2.0, initial user setup (set password / use SSO), farewell/feedback, Chrome Extension and AWS Marketplace redirect.

> **No onboarding, profile, or logout components here.** The multi-step onboarding wizard and the authenticated profile editor live in `libs/common/src/lib/onboarding` and `libs/common/src/lib/profile` — apps import `OnboardingComponent` / `ProfileComponent` from `@flaps/common`, not `@nuclia/user`. There is no `LogoutComponent` anywhere in the workspace.

**Used by:** `apps/auth`, `apps/admin`, `apps/dashboard`, `apps/rao`, `apps/manager-v2`
**Path alias:** `@nuclia/user` → `libs/user/src/index.ts`  
**Component prefix:** `nus` · **Nx project:** `user` · **Run:** `nx test user`

---

## Project Structure

```
libs/user/src/lib/
├── auth-user.module.ts     # AuthUserModule + authRoutes (login/signup/recover/reset/magic/consent/check-mail/callback/saml-login)
├── login-error.util.ts     # isCameFromLegit() + getLoginErrorMessageKey() (backend error_code → i18n key)
├── password.validator.ts   # StrongPassword + SamePassword validators
├── _user-layout.scss       # Shared auth page layout styles
├── callback/               # SSO / SAML / OAuth token callbacks (standalone)
├── check-mail/             # "Check your inbox" page
├── consent/                # OAuth 2.0 consent + resolver
├── farewell/               # Account-cancellation feedback + FarewellModule
├── login/                  # Email/password login (login.component) + OAuth-only challenge (app-login.component, standalone)
├── magic/                  # Magic-link token validation + dispatch service
├── recover/                # Forget-password form
├── redirect/               # Chrome-ext / Marketplace token hand-off (standalone)
├── reset/                  # Password-reset form; also serves `setup` (invite-onboarding set-password) route
├── saml-login/             # SAML IdP-initiated entry: validates params, bounces to the product app
├── setup-user/             # SetupUserComponent (set password / use SSO) + SetPasswordComponent (starts OAuth)
├── signup/                 # New account registration
│   ├── temporary/          # Context-box waitlist signup variant (standalone)
│   └── testing/            # Signup-key-gated signup page + TestingSignupService (standalone)
├── sso/                    # SSO provider button (Google / GitHub / Microsoft)
└── user-container/         # Shared layout wrapper (logo + brand name)
```

> No `onboarding/`, `profile/`, or `logout/` folders exist here anymore — see the note above.

---

## Public API

```ts
// NgModule (lazy-loadable) — only apps/auth uses this
import { AuthUserModule, authRoutes } from '@nuclia/user';

// FarewellModule — imports FarewellComponent + FeedbackComponent
import { FarewellModule } from '@nuclia/user';

// Standalone components wired directly into each consuming app's own routes
import {
  CallbackComponent,
  AppLoginComponent,
  RedirectComponent,
  SetupUserComponent,
  SetPasswordComponent,
  SsoButtonComponent,
  TestingAppSignupComponent,
  TemporaryContextBoxSignupComponent,
} from '@nuclia/user';
```

There is no exported guard from this lib (no `authGuard`) — `SetupUserComponent` and `AppLoginComponent` are unguarded; access control for `profile`/`onboarding` routes lives with those components in `@flaps/common`. `SamlLoginComponent` is not exported; it is reachable only through `authRoutes`.

---

## Route Table (`authRoutes`, declared in `auth-user.module.ts`)

`authRoutes` is only mounted by `apps/auth`. All routes below are public (no guard):

| Path                  | Component            | Notes                                                                    |
| --------------------- | -------------------- | ------------------------------------------------------------------------ |
| `login`               | `LoginComponent`     | `resolve: { loginData: loginResolver }`                                  |
| `signup`              | `SignupComponent`    |                                                                          |
| `recover`             | `RecoverComponent`   |                                                                          |
| `reset`               | `ResetComponent`     | plain password reset                                                     |
| `setup`               | `ResetComponent`     | same component; also collects full name (invite/onboarding set-password) |
| `magic`               | `MagicComponent`     |                                                                          |
| `join`                | `MagicComponent`     | alias of `magic`                                                         |
| `check-mail`          | `CheckMailComponent` |                                                                          |
| `consent`             | `ConsentComponent`   | `resolve: { consentData: consentResolver }`                              |
| `callback`            | `CallbackComponent`  |                                                                          |
| `callbacks/saml`      | `CallbackComponent`  | `data: { saml: true }`                                                   |
| `callbacks/google`    | `CallbackComponent`  | `data: { google: true }`                                                 |
| `callbacks/github`    | `CallbackComponent`  | `data: { github: true }`                                                 |
| `callbacks/microsoft` | `CallbackComponent`  | `data: { microsoft: true }`                                              |
| `saml-login`          | `SamlLoginComponent` | SAML IdP-initiated entry (see Conventions #10)                           |

**Components used outside `authRoutes`** — `RedirectComponent`, `FarewellComponent`/`FeedbackComponent` (via `FarewellModule`), `SetupUserComponent`, `SetPasswordComponent`, `AppLoginComponent`, `TestingAppSignupComponent`, `TemporaryContextBoxSignupComponent` are standalone and each consuming app (including `apps/auth` itself) declares its own routes for them. Current mounts: `apps/auth` → `/setup/user` (`SetupUserComponent`); `apps/admin` → `user/set-password`, `user/test-signup`, `user/contextbox-signup`; dashboard/rao/admin → `user/login-redirect` (`AppLoginComponent`). Check that app's own routing module/`AGENTS.md` for the exact paths.

---

## How Apps Import

### Pattern A — `LazyUserModule` wrapper (`apps/auth` only)

```ts
// lazy-user.module.ts
@NgModule({ imports: [AuthUserModule, RouterModule.forChild(authRoutes)] })
export class LazyUserModule {}

// app-routing.module.ts
{ path: 'user', loadChildren: () => import('./lazy-user.module').then(m => m.LazyUserModule) }
```

`apps/auth` also imports several standalone components (`RedirectComponent`, `FarewellComponent`, `FeedbackComponent`, `SetupUserComponent`) directly in its own `app-routing.module.ts` — they are not part of `authRoutes`.

### Pattern B — Direct component imports (`apps/admin`, `apps/dashboard`, `apps/rao`, `apps/manager-v2`)

These apps do **not** load `AuthUserModule`/`authRoutes` at all. They import individual standalone components from `@nuclia/user` (e.g. `CallbackComponent`, `AppLoginComponent`, `RedirectComponent`, `FarewellComponent`/`FeedbackComponent`) and declare their own routes for them (typically under a `user/*` prefix each app defines itself). `apps/admin` additionally mounts `SetPasswordComponent`, `TestingAppSignupComponent`, `TemporaryContextBoxSignupComponent`. `apps/manager-v2` only needs `AppLoginComponent` + `CallbackComponent`.

### reCAPTCHA setup

`AuthUserModule` provides `RECAPTCHA_V3_SITE_KEY` via factory reading `BackendConfigurationService.getRecaptchaKey()`. The app must have `BackendConfigurationService` available (from `@flaps/core`).

---

## Important Conventions

1. **`nus-` selector prefix** — only `LoginComponent`, `RecoverComponent`, `ResetComponent`, `SignupComponent`, `UserContainerComponent` actually use it. Most other components use legacy prefixes: `stf-` (`CallbackComponent`, `ConsentComponent`, `CheckMailComponent`, `MagicComponent`, `SsoButtonComponent`/`SsoButtonsComponent`) or `app-` (`FeedbackComponent`, `FarewellComponent`, `TestingAppSignupComponent`, `TemporaryContextBoxSignupComponent`). Route-only components (`SetupUserComponent`, `SetPasswordComponent`, `SamlLoginComponent`, `AppLoginComponent`, `RedirectComponent`) have no selector. Don't assume `nus-` on a component without checking its `@Component` decorator.
2. **Every component is standalone** (no `standalone:` flag needed — Angular 22 default). `AuthUserModule` and `FarewellModule` only _import_ components and provide the reCAPTCHA key / routes; nothing is declared in them.
3. **reCAPTCHA on all mutations** — every form calling a backend mutation (login, signup, recover, reset) first calls `reCaptchaV3Service.execute(action)`.
4. **Resolver auto-submit** — `loginResolver` auto-POSTs when `data.skip_login` is true; `consentResolver` does the same for `data.skip_consent`. Both return `EMPTY` to prevent component rendering. `loginResolver` also redirects to `signup` (with the email pre-set via `AuthService.setSignUpEmail`) when the backend reports `needs_signup`.
5. **`ResetComponent` serves two routes** — `reset` (plain password reset) and `setup` (invite/onboarding set-password, also collects full name). It distinguishes them by checking `route.url[0].path === 'setup'`, toggling `initFullname`. Keep both routes pointed at the same component when editing.
6. **Magic action dispatch** — `MagicService._execute` is the central dispatch table for backend-issued `MagicAction`s. `action: 'join_regional_kb'` takes a different path (`joinKb()` validates a zone-scoped token before dispatching) from all other actions (token exchanged up front, then dispatched directly). New backend action types must be added to `_execute`.
   - **Restarting OAuth after a stale `login_challenge`** — the `auth` app has no OAuth `client_id` of its own, so on `login_challenge_expired_or_invalid` (or the `account_ready_please_login` magic action) `MagicComponent` does **not** call `redirectToOAuth()` directly; it redirects the browser to the origin of the request's `came_from` URL (with a `message` query param) so the _originating_ app restarts the OAuth flow. If `came_from` is missing, it shows `login.error.missing_came_from` instead of redirecting.
7. **Redirect validation** — `RedirectComponent` validates `redirect` query param against `AUTHORIZED_REDIRECTS` and `AUTHORIZED_REDIRECTS_REGEX`. Update both constants when adding new redirect targets.
8. **Strong password validator** — `StrongPassword`: ≥8 chars, uppercase, lowercase, digit, special char from `! @ # $ % ^ & * . _ ( ) + = -`. `SamePassword(field)`: cross-field mismatch.
9. **Dead-code fields to be aware of** — `SignupComponent.signup_token` (declared, never assigned or read) and `SignupComponent.isGitHubEnabled` (`features.unstable.githubSignin`, computed but never read in the template) don't drive any UI behavior. Don't assume either does anything — verify in source before relying on them.
10. **SAML IdP-initiated handoff** — `SamlLoginComponent` (`saml-login`, reads `ref`, `nonce`, `came_from`) validates the URL (http/https, no credentials, `isCameFromLegit`) and does nothing if invalid; otherwise it redirects to the `came_from` origin root with `saml_ref`, `nonce`, `came_from`. In the product app, `authGuard` forces login when both `saml_ref` and `nonce` are present; `AppLoginComponent` then calls `redirectToOAuth({...params}, { prompt: 'login' })`; `CallbackComponent` authenticates directly (skipping the external `came_from` redirect) when the OAuth `state` carries `saml_ref` and `came_from` is legit. Don't reorder that check ahead of/behind the normal `came_from` redirect branch.
11. **Initial user setup** — `SetupUserComponent` (mounted by `apps/auth` at `/setup/user`) resolves `cameFrom` from `MagicService.cameFrom`, else from `sdk.getOriginForApp(app)` when the `app` query param is `platform` or `rag`. "Set password" navigates to `<admin origin>/user/set-password` (`NavigationService.getAdminOrigin()`) where `SetPasswordComponent` starts OAuth with `initial_setpassword: true`; "use SSO" goes to `cameFrom`. `MagicService` sends users here (`/setup/user` with `account`, plus `kb` for `redict_to_kb`) for the `goaccount` / `redict_to_kb` actions unless `needs_initial_setpassword === false` and a `cameFrom` exists (then it goes back to `cameFrom` with `login.invite_accepted_please_login`).
12. **Backend error → message mapping** — `getLoginErrorMessageKey(error_code, fallback, hasCameFrom)` in `login-error.util.ts` is used by `CallbackComponent`, `MagicComponent` and `ResetComponent`. Pass `hasCameFrom: true` when the user was already redirected back to the originating app (selects the `_restarted` copy). `login_challenge_expired_or_invalid` is deliberately not in the map (message depends on caller). `ResetComponent` maps HTTP 500 → `reset.invalid-token` and HTTP 410 (expired reset token) → the mapped `error_code` message; anything else → `generic.error.oops`.
13. **`TestingAppSignupComponent`** — selector `app-signup`, signal-based; its form (email, fullName, company, workflow, default `cowork`) is POSTed by `TestingSignupService` to `<auth url>/signup/start` with an `X-Signup-Key` header; on success it redirects to the RAG app origin (RAO when the URL contains `app=rao`) with `signup_token`.
