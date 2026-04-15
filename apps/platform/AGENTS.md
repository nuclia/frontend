# AGENTS.md — `platform` app

Angular (NgModule-based) app that serves the **Progress Cloud** branded platform
(`progress.cloud`). Provides account management and the `platform` sub-experience. Shares all
feature modules with `apps/dashboard` via `@flaps/common`.

**Nx project name:** `platform` · **Selector prefix:** `pla` · **Angular version:** 21

---

## Run Commands

```bash
nx serve platform        # dev server (stage backend)
nx build platform        # production build → dist/apps/platform
nx test platform         # Jest tests
```

---

## Project Structure

```
apps/platform/src/
├── environments/
│   ├── environment.ts       # client: 'platform', social_login: true
│   └── environment.prod.ts  # same values in prod
└── app/
    ├── app.module.ts            # Root NgModule — HTTP, i18n, toast, BaseModule
    ├── app-routing.module.ts    # Top-level routes (see Routing Tree)
    ├── app.component.ts         # Root — splash screen, translations, OAuth redirect
    ├── app-title.strategy.ts    # Custom TitleStrategy (BrandName – Account – KB)
    ├── home/
    │   └── home.component.ts    # Entry page at /at/:account/platform/
    ├── platform.component.ts    # Standalone shell (just <router-outlet>)
    └── random/
        └── random.component.ts  # /at/:account/platform/random placeholder page
```

---

## Routing Tree

```
/                          → BaseComponent (canActivate: authGuard)
  /                        → EmptyComponent (rootGuard → redirect to /select or /at/:account)
  /redirect                → RedirectComponent
  /at/:account             [setAccountGuard]
    /                      → redirect to /manage
    /manage                → AccountModule (lazy)
    /platform              → PlatformComponent
      /                    → HomeComponent
      /random              → RandomComponent
/select                    [authGuard, selectAccountGuard]
  /:account                → SelectKbComponent [selectKbGuard]
/feedback                  → FeedbackComponent [authGuard]
/farewell                  → FarewellComponent
/setup_account             → AwsOnboardingComponent [awsGuard]
/user/profile              → ProfileComponent [authGuard]
/user/callback             → CallbackComponent
/user/login-redirect       → AppLoginComponent
/user/signup               → TemporaryAppSignupComponent  ← TEMPORARY (progress.com migration)
/user/onboarding           → OnboardingComponent
/**                        → PageNotFoundComponent
```

---

## Guards

| Guard                | Source          | Enforces                                               |
| -------------------- | --------------- | ------------------------------------------------------ |
| `authGuard`          | `@flaps/core`   | User must be authenticated (`JWT_KEY` in localStorage) |
| `rootGuard`          | `@flaps/common` | Redirects to first account/KB or login                 |
| `setAccountGuard`    | `@flaps/common` | Loads account from URL slug into `SDKService`          |
| `selectAccountGuard` | `@flaps/common` | Skips selection if account already set                 |
| `selectKbGuard`      | `@flaps/common` | Redirects based on KB count                            |
| `awsGuard`           | `@flaps/common` | AWS Marketplace onboarding only                        |

---

## i18n

`MultiTranslateHttpLoader` merges translations from three buckets (in order):

1. `assets/i18n/user/` — from `@nuclia/user`
2. `assets/i18n/common/` — from `@flaps/common`
3. `assets/i18n/sync/` — from `@nuclia/sync`

---

## Title Strategy

`AppTitleStrategy` sets `<BrandName> – <AccountTitle>` or `<BrandName> – <AccountTitle> – <KbTitle>` depending on the current URL. Brand name comes from `BackendConfigurationService.getBrandName()`.

---

## Gotchas

- **`/user/signup` is temporary.** The `TemporaryAppSignupComponent` route exists while the
  signup form is being migrated to `progress.com`. Remove once migration is complete.
- **`/at/:account` redirects to `/manage`**, not to a KB dashboard. This app is account-scoped
  (no `/at/:account/:zone/:kb` pattern). All KB routes live in `apps/dashboard`.
- **`PlatformComponent` is standalone** (`imports: [RouterOutlet]`) but used inside an NgModule
  route. This is an intentional pattern — declare it in the module via `imports[]`, not
  `declarations[]`.
- **No HTTP interceptors registered.** The `AuthInterceptor` (used by `dashboard`/`rao`) is
  absent. Auth headers are injected by the SDK directly.
- **`client: 'platform'`** in `environment.ts` — `BackendConfigurationService` uses this to
  distinguish this deployment from `'rao'` or `'auth'`.
