# AGENTS.md — `libs/user`

## Library Overview

`libs/user` is an Angular feature library encapsulating all **user-facing auth, identity, and account-setup flows** shared across Nuclia frontend apps.

Exposes:
- `UserModule` — self-registers child routes; used as `loadChildren` target.
- `userRoutes` — pre-built route array to attach under a parent path (conventionally `/user`).
- Standalone and non-standalone components re-exported individually.

Handles: email/password login+signup, password recovery+reset, magic-link, SSO (Google/GitHub/Microsoft), SAML, OAuth 2.0, multi-step onboarding wizard, profile editing, invite acceptance, farewell/feedback, Chrome Extension and AWS Marketplace redirect.

**Used by:** `apps/dashboard`, `apps/rao`, `apps/manager-v2`  
**Path alias:** `@nuclia/user` → `libs/user/src/index.ts`  
**Component prefix:** `nus` · **Nx project:** `user` · **Run:** `nx test user`

---

## Project Structure

```
libs/user/src/lib/
├── user.module.ts          # UserModule + userRoutes
├── password.validator.ts   # StrongPassword + SamePassword validators
├── _user-layout.scss       # Shared auth page layout styles
├── callback/               # SSO / SAML / OAuth token callbacks
├── check-mail/             # "Check your inbox" page
├── consent/                # OAuth 2.0 consent + resolver
├── farewell/               # Account-cancellation feedback
├── invite/                 # Invited-user password-set + guard
├── login/                  # Email/password login + OAuth challenge
├── logout/                 # Clears auth + redirects
├── magic/                  # Magic-link token validation
├── onboarding/             # Multi-step wizard: company → KB → zone → model → progress
│   ├── step1/              # Company/contact form
│   ├── kb-creation-steps/  # Steps 2–4: KB name / zone / embedding model
│   ├── setting-up/         # Final "creating your KB" progress screen
│   └── onboarding.service.ts / onboarding.models.ts
├── profile/                # Authenticated user profile editor
├── recover/                # Forget-password form
├── redirect/               # Chrome-ext / Marketplace token hand-off
├── reset/                  # Password-reset form (magic token from URL)
├── signup/                 # New account registration
├── sso/                    # SSO provider button (Google / GitHub / Microsoft)
└── user-container/         # Shared layout wrapper (logo + brand name)
```

---

## Public API

```ts
// NgModule (lazy-loadable)
import { UserModule, userRoutes } from '@nuclia/user';

// Standalone components for individual use
import {
  SignupComponent, SsoButtonComponent, CheckMailComponent, OnboardingComponent,
  FarewellComponent, FeedbackComponent, InviteComponent, RedirectComponent
} from '@nuclia/user';

// Guard
import { inviteGuard } from '@nuclia/user';
```

---

## Route Table (`userRoutes`)

| Path | Component / Redirect | Auth? |
|---|---|---|
| `login` | `LoginComponent` | no |
| `logout` | `LogoutComponent` | no |
| `signup` | `SignupComponent` | no |
| `recover` | `RecoverComponent` | no |
| `reset` | `ResetComponent` | no |
| `check-mail` | `CheckMailComponent` | no |
| `callback` | `CallbackComponent` | no |
| `consent` | `ConsentComponent` | no |
| `magic` | `MagicComponent` | no |
| `invite` | `InviteComponent` (canActivate: `inviteGuard`) | no |
| `farewell` | `FarewellComponent` | no |
| `redirect` | `RedirectComponent` | no |
| `onboarding` | `OnboardingComponent` | no |
| `profile` | `ProfileComponent` | **yes** (`authGuard`) |

---

## How Apps Import

### Pattern A — `LazyUserModule` wrapper (dashboard, rao)

```ts
// lazy-user.module.ts
@NgModule({ imports: [UserModule, RouterModule.forChild(userRoutes)] })
export class LazyUserModule {}

// app-routing.module.ts
{ path: 'user', loadChildren: () => import('./lazy-user.module').then(m => m.LazyUserModule) }
```

### Pattern B — Direct lazy load (manager-v2)
```ts
{ path: 'user', loadChildren: () => import('../../../../libs/user/src/lib/user.module').then(m => m.UserModule) }
// Note: uses direct path, not @nuclia/user alias — intentional (suppressed ESLint boundary warning)
```

### reCAPTCHA setup
`UserModule` provides `RECAPTCHA_V3_SITE_KEY` via factory reading `BackendConfigurationService.getRecaptchaKey()`. The app must have `BackendConfigurationService` available (from `@flaps/core`).

---

## Important Conventions

1. **`nus-` selector prefix** — all components. Exceptions for legacy selectors (`stf-`, `app-`, `nuclia-`).
2. **Non-standalone root, standalone sub-components** — major page components declared in `UserModule`; sub-components (onboarding sub-steps, `SettingUpComponent`, `RedirectComponent`, `PasswordFormComponent`, `EmbeddingsModelFormComponent`) are standalone.
3. **reCAPTCHA on all mutations** — every form calling a backend mutation (login, signup, recover, reset) first calls `reCaptchaV3Service.execute(action)`.
4. **Resolver auto-submit** — `loginResolver` auto-POSTs when `data.skip_login` is true; `consentResolver` does the same for `data.skip_consent`. Both return `EMPTY` to prevent component rendering.
5. **RAO onboarding step skipping** — `OnboardingService.nextStep()` checks `NavigationService.inRaoApp`; when true, step 2 jumps to step 4 (skips zone step). Maintain this parity when adding steps.
6. **KB creation retry** — `OnboardingService.createKb` retries 5xx up to 5 times; 4xx fails immediately. Failure reported via Sentry + redirects to account page.
7. **`signup_token` pre-fills sign-up data** — when `?signup_token=` is present, `authGuard` stores it via `AuthService.setSignUpToken()`. `OnboardingService` later reads it to pre-fill company name and full name in step 1. `SignupComponent` also reads it to skip form fields already populated.
8. **GEMINI_2 model option** — `user.kb.creation-form.models.options.GEMINI_2` i18n key maps to `'Gemini Embedding 2'`. Present in all locale files.
7. **Redirect validation** — `RedirectComponent` validates `redirect` query param against `AUTHORIZED_REDIRECTS` and `AUTHORIZED_REDIRECTS_REGEX`. Update both constants when adding new redirect targets.
8. **Magic action routing** — `MagicService._execute` is the central dispatch table. New backend action types must be added here.
9. **`authGuard` on profile only** — the only protected route is `profile`. All others are public.
10. **Strong password validator** — `StrongPassword`: ≥8 chars, uppercase, lowercase, digit, special char from `! @ # $ % ^ & * . _ ( ) + = -`. `SamePassword(field)`: cross-field mismatch.
