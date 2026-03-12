# GitHub Copilot Instructions

This is a Nuclia frontend Nx monorepo. See `README.md` for general project setup.

## Skills

When the following tasks come up, load and follow the corresponding skill file before acting:

### agents-review
**When to use:** Any time the user asks to review, improve, refactor, or create an AGENTS.md file — or when you notice a project in `apps/` or `libs/` is missing an AGENTS.md.
**How to activate:** Read `.claude/skills/agents-review/SKILL.md` with `read_file` and follow its instructions exactly.

### skill-creator
**When to use:** Any time the user asks to create a new skill, improve an existing skill, run evals on a skill, or optimize a skill's description.
**How to activate:** Read `.claude/skills/skill-creator/SKILL.md` with `read_file` and follow its instructions exactly.

### design-system
**When to use:** Any time a task involves Angular UI in this monorepo — creating or modifying components in dashboard, rao, manager-v2, or nucliadb-admin; using `nsi-*` or `pa-*` components; styling with SCSS tokens; implementing modals, toasts, tables, forms, tabs, cards, icons, settings pages, or any other UI pattern. Also use when asked about design tokens, colour palette, typography, spacing, or component APIs.
**How to activate:** Read `.claude/skills/design-system/SKILL.md` with `read_file` and follow its instructions exactly.

### angular-patterns
**When to use:** Any Angular task in this monorepo — creating or modifying components, writing services, managing state, adding routes or guards, refactoring legacy code to modern Angular 21 style, debugging change detection issues, or deciding which state management tier to use. Also use when migrating from `@Input`/`@Output` decorators, constructor injection, or NgModules to the modern signal-based style.
**How to activate:** Read `.claude/skills/angular-patterns/SKILL.md` with `read_file` and follow its instructions exactly.

### rxjs-patterns
**When to use:** Any task that writes or modifies a `.pipe()`, creates a Subject, adds a subscription in a service or component, uses `catchError`/`switchMap`/`forkJoin`/`combineLatest`, or requires choosing between RxJS operators. Also use when debugging streams that never emit, emit multiple times unexpectedly, or cause memory leaks. Applies to Angular apps and libs (not search-widget or rao-widget).
**How to activate:** Read `.claude/skills/rxjs-patterns/SKILL.md` with `read_file` and follow its instructions exactly.

### nx-monorepo
**When to use:** Any Nx workspace task — running or debugging builds/tests/serve, adding a new library or app, editing `project.json` targets or executors, understanding the project graph or module boundary violations, using `nx affected` commands, fixing cache issues, or using generators (`nx g`). Also use when the user asks which project name to pass to an `nx` command, or needs to know current tags and boundary constraints.
**How to activate:** Read `.claude/skills/nx-monorepo/SKILL.md` with `read_file` and follow its instructions exactly.

### testing-patterns
**When to use:** Any task that writes or modifies a `*.spec.ts` file, sets up a TestBed configuration, mocks Angular services, works with OnPush components in tests, debugs failing tests, or writes Vitest tests for `search-widget` (Svelte 5) or `rao-widget` (React 19). Also use when the user asks about `ng-mocks`, `fixture.detectChanges()`, signal inputs in tests, `fakeAsync`/`tick`, `MockProvider`, `MockModule`, or Vitest `mount`/`unmount`.
**How to activate:** Read `.claude/skills/testing-patterns/SKILL.md` with `read_file` and follow its instructions exactly.

### api-sdk
**When to use:** Any task that involves calling the Nuclia API, adding a new endpoint, extending `KnowledgeBox` or `RetrievalAgent`, creating or modifying an Angular service that fetches data, working with `SDKService`, handling HTTP errors from the SDK, or understanding the `@nuclia/core` SDK structure. Also use when the user asks how to add a new API call, wrap an SDK method in Angular, or handle `IErrorResponse` from search/ask.
**How to activate:** Read `.claude/skills/api-sdk/SKILL.md` with `read_file` and follow its instructions exactly.


### code-review
**When to use:** Any time the user says "review", "code review", "review this PR", "review this diff", "review these changes", or "review this file". Reviews changed files or a diff against all monorepo standards: Angular 21 patterns, RxJS best practices, design system usage, SDK patterns, Nx module boundaries, test coverage, and TypeScript hygiene.
**How to activate:** Read `.claude/skills/code-review/SKILL.md` with `read_file` and follow its instructions exactly.

### bug-finder
**When to use:** Any time the user asks to "find bugs", "check for bugs", "what could go wrong", "is this correct?", or when auditing code specifically for runtime defects. Also invoke automatically from within code-review or any automated agent that needs a focused bug scan. Covers memory leaks, race conditions, null dereference, change detection bugs, signal misuse, form bugs, router bugs, and silent error swallowing — but never style or architecture issues.
**How to activate:** Read `.claude/skills/bug-finder/SKILL.md` with `read_file` and follow its instructions exactly.

### error-handling
**When to use:** Any task that involves handling SDK responses from `search()`, `ask()`, `find()`, or `catalog()`, writing `catchError` callbacks, showing error toasts via `SisToastService`, handling `IErrorResponse`, adding retry logic, or surfacing errors in the UI. Also use when a toast receives a raw string instead of an i18n key, when 401/400 is being handled in a component instead of delegating to `AuthInterceptor`, or when `shareReplay` appears before `catchError` in a pipeline.
**How to activate:** Read `.claude/skills/error-handling/SKILL.md` with `read_file` and follow its instructions exactly.

### performance
**When to use:** Any task that involves adding or reviewing `@for` loops, choosing between `signal()` and `computed()`, setting up lazy-loaded routes, writing service-level streams with `shareReplay`, handling resize or input debouncing, rendering long lists, or reviewing a component for change detection issues. Also use when `markForCheck()`, `shareReplay()` without a buffer argument, `$index` in `track` expressions, or eager route loading is found during code review.
**How to activate:** Read `.claude/skills/performance/SKILL.md` with `read_file` and follow its instructions exactly.

### i18n-patterns
**When to use:** Any task that involves adding, renaming, or deleting a translation key, using the `translate` pipe in a template, calling `TranslateService`, wiring up i18n in a new component or library, or working with translation files. Also use when a user mentions BabelEdit, when a string is hardcoded in English in a template that should be translatable, or when working with translations in the `search-widget` (Svelte 5) — which uses a different i18n system than Angular.
**How to activate:** Read `.claude/skills/i18n-patterns/SKILL.md` with `read_file` and follow its instructions exactly.

### knowledge-sync
**When to use:** Any time a large commit or PR lands and documentation might be stale — user says "there was a big update", "sync knowledge", "update AGENTS.md after this commit", "keep knowledge up-to-date", or provides a commit hash asking what needs updating. Also use when the staleness check script reports stale files, when a new `apps/` or `libs/` project was created without an AGENTS.md, or when a skill references a renamed/deleted class. Proactively suggest running the staleness check after any merge that touches 10+ files.
**How to activate:** Read `.claude/skills/knowledge-sync/SKILL.md` with `read_file` and follow its instructions exactly.

## Agents

For non-trivial multi-step tasks, delegate to the agent system via the orchestrator.

### When to use the orchestrator
Load `.claude/agents/orchestrator.md` when the task:
- Touches more than one domain (UI + API, component + tests, etc.)
- Is described as "build a feature", "add end-to-end", or "create a tested component"
- Requires coordinating output from multiple specialists

### Direct agent invocation (single-domain tasks)
When the task is clearly single-domain, load the specialist directly:

| Task type | Load agent |
|-----------|------------|
| Build / modify Angular UI, templates, SCSS, i18n | `.claude/agents/ui-builder.md` |
| Write or fix `*.spec.ts` files | `.claude/agents/test-writer.md` |
| Add API calls, SDK endpoints, Angular services | `.claude/agents/api-integrator.md` |
| RxJS pipelines, signals, performance | `.claude/agents/reactive-expert.md` |
| Code review, find bugs | `.claude/agents/quality-inspector.md` |
| Nx build/test/serve, project.json, generators | `.claude/agents/infra-expert.md` |
| Sync AGENTS.md and skill docs after a commit/PR | `.claude/agents/knowledge-keeper.md` |

