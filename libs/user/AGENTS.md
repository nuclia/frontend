# AGENTS.md — `libs/user`

## Library Overview

`libs/user` is an Angular feature library encapsulating all **user-facing auth, identity, and account-setup flows** shared across Nuclia frontend apps.

Exposes:

- `AuthUserModule` + `authRoutes` — the core OAuth/login/signup flow, self-contained NgModule + route array. Only `apps/auth` loads this (via a `LazyUserModule` wrapper).
- Standalone components re-exported individually — every other consuming app wires these directly into its own routes instead of loading the module.

Handles: email/password login+signup, password recovery+reset, magic-link, SSO (Google/GitHub/Microsoft), SAML, OAuth 2.0, invite acceptance, farewell/feedback, Chrome Extension and AWS Marketplace redirect.

> **Onboarding and profile moved out.** The multi-step onboarding wizard and the authenticated profile editor used to live here but were relocated to `libs/common/src/lib/onboarding` and `libs/common/src/lib/profile`. Apps now import `OnboardingComponent` / `ProfileComponent` from `@flaps/common`, not `@nuclia/user`. There is also no `LogoutComponent` in this lib (or anywhere in the workspace) anymore.

**Used by:** `apps/auth`, `apps/dashboard`, `apps/rao`, `apps/manager-v2`, `apps/platform`  
**Path alias:** `@nuclia/user` → `libs/user/src/index.ts`  
**Component prefix:** `nus` · **Nx project:** `user` · **Run:** `nx test user`

---

## Project Structure

```
libs/user/src/lib/
├── auth-user.module.ts     # AuthUserModule + authRoutes (login/signup/recover/reset/magic/consent/check-mail/callback)
├── password.validator.ts   # StrongPassword + SamePassword validators
├── _user-layout.scss       # Shared auth page layout styles
├── callback/               # SSO / SAML / OAuth token callbacks (standalone)
├── check-mail/             # "Check your inbox" page
├── consent/                # OAuth 2.0 consent + resolver
├── farewell/               # Account-cancellation feedback + FarewellModule
├── invite/                 # Invited-user password-set (invite.component + set-password.component, standalone)
├── login/                  # Email/password login (login.component) + OAuth-only challenge (app-login.component, standalone)
├── magic/                  # Magic-link token validation + dispatch service
├── recover/                # Forget-password form
├── redirect/               # Chrome-ext / Marketplace token hand-off (standalone)
├── reset/                  # Password-reset form; also serves `setup` (invite-onboarding set-password) route
├── signup/                 # New account registration
│   ├── temporary/          # Context-box waitlist signup variant (standalone)
│   └── testing/            # Password-gated signup demo page (standalone)
├── sso/                    # SSO provider button (Google / GitHub / Microsoft)
└── user-container/         # Shared layout wrapper (logo + brand name)
```

> No `onboarding/`, `profile/`, or `logout/` folders exist here anymore — see the note above.

---

## Public API

```ts
// NgModule (lazy-loadable) — only apps/auth uses this
import { AuthUserModule, authRoutes } from '@nuclia/user';

// FarewellModule — declares FarewellComponent + FeedbackComponent
import { FarewellModule } from '@nuclia/user';

// Standalone components wired directly into each consuming app's own routes
import {
  CallbackComponent,
  AppLoginComponent,
  RedirectComponent,
  InviteComponent,
  SetPasswordComponent,
  SsoButtonComponent,
  TestingAppSignupComponent,
  TemporaryContextBoxSignupComponent,
} from '@nuclia/user';
```

There is no exported guard from this lib (no `authGuard` / `inviteGuard`) — `InviteComponent` and `AppLoginComponent` are unguarded; access control for `profile`/`onboarding` routes now lives with those components in `@flaps/common`.

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

**Components used outside `authRoutes`** — `RedirectComponent`, `FarewellComponent`/`FeedbackComponent` (via `FarewellModule`), `InviteComponent`, `SetPasswordComponent`, `AppLoginComponent`, `TestingAppSignupComponent`, `TemporaryContextBoxSignupComponent` are standalone and each consuming app (including `apps/auth` itself) declares its own routes for them under whatever path it chooses (e.g. dashboard uses `user/login-redirect`, `user/set-password`, `user/test-signup`, `user/contextbox-signup`). Check that app's own routing module/`AGENTS.md`, not this file, for the exact paths.

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

`apps/auth` also imports several standalone components (`RedirectComponent`, `FarewellComponent`, `FeedbackComponent`, `InviteComponent`) directly in its own `app-routing.module.ts` — they are not part of `authRoutes`.

### Pattern B — Direct component imports (`apps/dashboard`, `apps/rao`, `apps/platform`, `apps/manager-v2`)

These apps do **not** load `AuthUserModule`/`authRoutes` at all. They import individual standalone components from `@nuclia/user` (e.g. `CallbackComponent`, `AppLoginComponent`, `RedirectComponent`, `FarewellComponent`/`FeedbackComponent`, `SetPasswordComponent`, `TestingAppSignupComponent`, `TemporaryContextBoxSignupComponent`) and declare their own routes for them (typically under a `user/*` prefix each app defines itself). `apps/manager-v2` only needs `AppLoginComponent` + `CallbackComponent`.

### reCAPTCHA setup

`AuthUserModule` provides `RECAPTCHA_V3_SITE_KEY` via factory reading `BackendConfigurationService.getRecaptchaKey()`. The app must have `BackendConfigurationService` available (from `@flaps/core`).

---

## Important Conventions

1. **`nus-` selector prefix** — only `LoginComponent`, `RecoverComponent`, `ResetComponent`, `SignupComponent`, `UserContainerComponent` actually use it. Most other components use legacy prefixes: `stf-` (`CallbackComponent`, `ConsentComponent`, `CheckMailComponent`, `MagicComponent`, `SsoButtonComponent`/`SsoButtonsComponent`), `nuclia-` (`InviteComponent`), or `app-` (`FeedbackComponent`, `FarewellComponent`, `TestingAppSignupComponent`, `TemporaryContextBoxSignupComponent`). Don't assume `nus-` on a component without checking its `@Component` decorator.
2. **Non-standalone declared in `AuthUserModule`** — `LoginComponent`, `RecoverComponent`, `MagicComponent`, `ResetComponent`, `ConsentComponent`, `SignupComponent`, `CheckMailComponent`. **Non-standalone declared in `FarewellModule`** — `FarewellComponent`, `FeedbackComponent`. Everything else (`CallbackComponent`, `RedirectComponent`, `InviteComponent`, `SetPasswordComponent`, `AppLoginComponent`, `SsoButtonComponent`, `TestingAppSignupComponent`, `TemporaryContextBoxSignupComponent`, `UserContainerComponent`) is standalone.
3. **reCAPTCHA on all mutations** — every form calling a backend mutation (login, signup, recover, reset) first calls `reCaptchaV3Service.execute(action)`.
4. **Resolver auto-submit** — `loginResolver` auto-POSTs when `data.skip_login` is true; `consentResolver` does the same for `data.skip_consent`. Both return `EMPTY` to prevent component rendering. `loginResolver` also redirects to `signup` (with the email pre-set via `AuthService.setSignUpEmail`) when the backend reports `needs_signup`.
5. **`ResetComponent` serves two routes** — `reset` (plain password reset) and `setup` (invite/onboarding set-password, also collects full name). It distinguishes them by checking `route.url[0].path === 'setup'`, toggling `initFullname`. Keep both routes pointed at the same component when editing.
6. **Magic action dispatch** — `MagicService._execute` is the central dispatch table for backend-issued `MagicAction`s. `action: 'join_regional_kb'` takes a different path (`joinKb()` validates a zone-scoped token before dispatching) from all other actions (token exchanged up front, then dispatched directly). New backend action types must be added to `_execute`.
7. **Redirect validation** — `RedirectComponent` validates `redirect` query param against `AUTHORIZED_REDIRECTS` and `AUTHORIZED_REDIRECTS_REGEX`. Update both constants when adding new redirect targets.
8. **Strong password validator** — `StrongPassword`: ≥8 chars, uppercase, lowercase, digit, special char from `! @ # $ % ^ & * . _ ( ) + = -`. `SamePassword(field)`: cross-field mismatch.
9. **Dead-code fields to be aware of** — `SignupComponent.signup_token` (declared, never assigned or read) and `SignupComponent.isGitHubEnabled` (`features.unstable.githubSignin`, computed but never read in the template) no longer drive any UI behavior in this lib. The GitHub-gating and signup-token-prefill behavior they once implemented is gone. Don't assume either still does anything — verify in source before relying on them.
