```skill
---
name: code-review
description: >
  Performs a focused code review of changed files or PR diffs in the Nuclia frontend monorepo.
  Activates when the user explicitly says "review", "code review", "review this PR", "review this
  diff", "review these changes", or "review this file". Checks changed code against all repo
  standards: Angular 21 patterns, RxJS best practices, design system usage, SDK patterns, module
  boundaries, test coverage, and general TypeScript hygiene. Returns a flat list of findings grouped
  by file with a severity label for each.
---

# Code Review — Nuclia Frontend Monorepo

Review changed code against all repo standards. Do not re-summarise what the code does —
only flag actionable problems and suggest concrete fixes.

---

## Step 0 — Set Scope

1. If the user pastes a diff or code directly, use that.
2. Otherwise run: `git diff main...HEAD` for a branch diff, or `git diff HEAD` for unstaged + staged.
   Use `get_changed_files` to list changed files, then read them.
3. Read the affected project AGENTS.md for project-specific gotchas and intentional exceptions.
4. Focus only on lines added or modified (`+` lines in a diff). Pre-existing issues in unchanged
   lines are out of scope unless the new code creates a dependency on them.

---

## Step 1 — Run the Bug Finder First

Before checking style/standards, scan the diff with the bug-finder skill (read
`.claude/skills/bug-finder/SKILL.md`). Output CRASH / BUG / LEAK / RACE findings at the top
of the report under a "## Runtime Bugs" heading.

Only then proceed with the standards checklist below.

---

## Step 2 — Standards Checklist

Work through every changed TypeScript / HTML / SCSS file. Flag issues only when they appear in
the diff.

---

### Angular

Read `.claude/skills/angular-patterns/SKILL.md` if you encounter a non-obvious Angular issue.

#### Non-negotiable (ERROR if missing/wrong)

- **`changeDetection: ChangeDetectionStrategy.OnPush` missing** — every `@Component` must have it.
- **Constructor injection** — new code must use `inject()` as a property initialiser, not
  constructor parameters.
- **`@Input()` / `@Output()` decorators on new components** — use signal APIs:
  `input()` / `input.required()` / `output()` / `model()`.
- **Cross-app or lib-imports-from-app module boundary violations** — always ERROR.
- **Service with `providedIn: 'root'` also listed in a component `providers: []`** — creates a
  second instance; almost always a bug.

#### Should fix (WARN)

- **`standalone: true` written explicitly** — redundant in Angular 19+; remove.
- **`styleUrls: [...]` array form** — should be `styleUrl: '...'` (singular string).
- **`ngOnDestroy` + manual unsubscribe** — should use `takeUntilDestroyed()` or `toSignal()`.
- **`toSignal()` assignment inside `ngOnInit`** — belongs in the property initializer.
- **Direct DOM manipulation** (`document.querySelector`, `element.nativeElement.style`) — flag
  unless specifically required by a third-party integration.
- **`ChangeDetectorRef.markForCheck()` in new code** — replace with signals + `toSignal()`.

#### Minor (STYLE)

- **Getter for a value derivable via `computed()`** — prefer `computed(() => ...)` for memoisation.
- **`ngClass` / `ngStyle` instead of signal-driven class binding** — `[class.active]="isActive()"` is cleaner.

---

### RxJS

Read `.claude/skills/rxjs-patterns/SKILL.md` for operator edge-cases.

#### Non-negotiable (ERROR)

- **`.subscribe()` without cleanup** — must have `takeUntilDestroyed()`, `take(1)`, `async` pipe,
  or stored subscription + `unsubscribe()` in `ngOnDestroy`. Mark as LEAK.
- **Nested `.subscribe()` calls** — always wrong; use `switchMap` / `mergeMap` / `concatMap`.
- **`mergeMap` for search-as-you-type or navigation** — stale response races; use `switchMap`.
- **`switchMap` for sequential write operations (POST/PUT/DELETE)** — cancels in-flight writes; use `concatMap`.
- **`shareReplay()` without buffer argument** — memory leak; use `shareReplay(1)`.

#### Should fix (WARN)

- **`catchError` returning `EMPTY` with no logging** — swallows errors silently.
- **`shareReplay(1)` placed before `catchError`** — replays errors to future subscribers.
  Correct order: `catchError` first, `shareReplay(1)` last.
- **`new Subject()` used as `takeUntil` notifier** — replace with `takeUntilDestroyed()`.
- **`mergeMap` where only one concurrent request is valid** — use `exhaustMap` for form submit.

---

### State Management

- **Raw `BehaviorSubject` exposed publicly** — must be private subject + public `.asObservable()`.
- **Signal store (`*.state.ts`) mutating state outside `patchState()`** — bypasses change detection.
- **`signal()` holding an array mutated in-place** — use `this.items.update(list => [...list, x])`.
- **Observable used in template without `async` pipe or `toSignal()`** — template won't update.

---

### Design System

Read `.claude/skills/design-system/SKILL.md` for component-specific guidance.

- **Hardcoded hex/rgb colours** — must use `var(--<token>)` or Sistema SCSS tokens.
- **Pixel values for spacing where a token exists** — prefer `var(--spacing-*)` or `$nsi-space-*`.
- **Native HTML elements replacing Sistema/Pastanaga components**:
  - `<button>` should be `<pa-button>` or `<nsi-button>`
  - plain `<input>` should use `paInput` directive or `<pa-input>`
  - custom overlay / dialog should use `SisModalService`
  - raw toast call should use `SisToastService`
- **Inline styles** (`style="..."`) — move to SCSS.
- **`PaModalModule` / `PaToastService` instead of `SisModalService` / `SisToastService`** — use the Sistema wrappers.

---

### SDK / API

Read `.claude/skills/api-sdk/SKILL.md` and `.claude/skills/error-handling/SKILL.md` for more.

- **Direct `fetch()` or `HttpClient` calls in a component** — ERROR; all HTTP goes through the SDK or a `@flaps/core` service.
- **`new Nuclia(...)` instantiated outside `SDKService`** — ERROR; inject `SDKService`.
- **`search()` / `find()` / `ask()` / `catalog()` result used without checking `result.type === 'error'`**
  — these return `IErrorResponse` inline. Unchecked = crashes on error responses.
- **Toast receiving a raw string instead of an i18n key** — must be an i18n key, not English prose.
- **401 / 400 errors caught in a component `catchError`** — `AuthInterceptor` owns these; re-throw.
- **Regional endpoint called without `zoneSlug` or `kb.path`** — wrong server, silent 404.
- **`retry429Config` missing on rate-limited write endpoints** — add `retry(retry429Config)` from `@nuclia/core`.

---

### i18n

Read `.claude/skills/i18n-patterns/SKILL.md` for details.

- **Hardcoded English string in a template** — must go through `| translate` or `TranslateService`.
- **Translation key added in fewer than all 4 locale files** (`en`, `es`, `fr`, `ca`) — WARN.
- **String concatenation instead of translate params** — use `{ value: x }` params object.

---

### Performance

Quick hits (read `.claude/skills/performance/SKILL.md` for full context):

- **`@for` without meaningful `track`** — `track $index` on API data loses DOM nodes on re-order; use `track item.id`.
- **Eager route loading** — new feature routes must use `loadComponent` / `loadChildren`.
- **`debounceTime` missing on user-input streams** — 300 ms standard.
- **`auditTime` missing on resize events** — 100-200 ms standard.
- **Lists > ~100 items without virtual scroll** — flag for `cdk-virtual-scroll-viewport`.

---

### Module Boundaries

- **Cross-app imports** — apps must not import from other apps.
- **Library importing from an app** — `libs/*` must never import from `apps/*`.
- **Deep relative path bypassing the path alias** — use `@nuclia/core` not `../../libs/sdk-core/src/...`.
  Exception: lazy-loaded routes with an `// eslint-disable-next-line` comment.

---

### Tests

- **New exported component / service / function with no spec** — flag if no `*.spec.ts` added or updated.
- **`fixture.detectChanges()` missing after signal input or state mutation** — OnPush requires it.
- **Real `HttpClient` provided in a unit test** — should use `provideHttpClientTesting()`.
- **`jest.fn()` used in a Vitest file** — should be `vi.fn()`.
- **`vi.fn()` used in a Jest/Angular file** — should be `jest.fn()`.
- **Real service injected without `MockProvider`** — unit tests must not make real HTTP calls.
- **`any` cast used to bypass TypeScript in a test** — hides real typing gaps.

---

### TypeScript Hygiene

- **`any` in new code** — replace with a concrete type or `unknown`.
- **Non-null assertion `!` on an observably nullable value** — only acceptable if call-site provably guarantees non-null.
- **`console.log` left in production code** — remove before merging.
- **Magic strings or numbers repeated more than once** — extract to a named constant.
- **`as SomeType` cast without comment** — flag if it hides a type error.

---

### Security (always ERROR)

- **API key or secret literal in source** — any long base64-ish string near words like "key", "token", "secret", "password".
- **`innerHTML` assigned from user-controlled data without sanitisation** — XSS risk.
- **`bypassSecurityTrustHtml` / `bypassSecurityTrustUrl` used** — always flag; require a comment explaining why it is safe.
- **Auth tokens stored in `localStorage` / `sessionStorage`** — tokens must stay in memory or httpOnly cookies.

---

## Step 3 — Output Format

Group findings by file. Within a file, order by line number.

Each finding on one line:
`**[SEVERITY]** path/to/file.ts (~L42) — what is wrong. Suggested fix.`

Severity labels:
- **ERROR** — non-negotiable rule violation (OnPush missing, memory leak, cross-app import, unguarded IErrorResponse, hardcoded secret)
- **WARN** — pattern mismatch that should be fixed before merging but won't crash immediately
- **STYLE** — minor style / redundancy issue; fix if easy
- **INFO** — observation worth noting; no change required

Finish with a summary line: `X errors, Y warnings, Z style notes across N files.`

Skip files with zero findings — do not write a "looks good" line per file.

---

## What NOT to flag

- Pre-existing issues in unchanged lines (unless new code directly depends on them).
- Documented intentional exceptions (`eslint-disable` with a reason, AGENTS.md gotchas).
- Stylistic choices not covered by repo rules above.
- Product or feature decisions.
- Issues already caught by a failing lint rule.
```
