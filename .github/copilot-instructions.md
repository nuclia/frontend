# GitHub Copilot Instructions

Nuclia frontend Nx monorepo. See `AGENTS.md` for workspace structure and `README.md` for project setup.

---

## Core Workflow Rules

### 1. Validate Before Executing

**Do not start implementing until the task is clear.** Before writing any code:

1. **Restate the task** in one sentence to confirm understanding.
2. **Identify ambiguities** — which project? which component? what's the expected behaviour?
3. **Ask open questions** if anything is unclear. Prefer open-ended questions over yes/no when you need context. A 50-token question is always cheaper than a 5000-token wrong implementation.
4. **State your plan** briefly before starting (2-3 bullet points, not a wall of text).

When to ask vs. when to infer:

- **Ask** when: the target project is ambiguous, the scope could change which files are touched, or a wrong assumption would require significant rework.
- **Infer** when: the project can be determined from file paths or previous messages, the task is purely additive, or the user has already answered a similar question in this session.

### 2. Anti-Cycling Protocol

Token waste from spinning is the biggest efficiency killer. Follow these rules strictly:

- **3-attempt maximum.** If the same approach fails 3 times (build error, test failure, lint error), STOP. Explain what you tried, what failed, and ask the user for guidance.
- **Pivot after 2.** If 2 attempts at the same approach fail, try a fundamentally different approach on the 3rd attempt — don't iterate on a broken idea.
- **No speculative exploration.** Don't read 20 files "just in case." Read the files you need, act, verify. If you need more context, read more files — but always with a specific question in mind.
- **Detect your own loops.** If you notice you're doing the same grep/read/edit cycle without making progress, stop and tell the user what's blocking you.
- **Scope-check long tasks.** If a task is taking more than ~10 tool calls without visible progress, pause and reassess: is the approach wrong? Is the task bigger than expected? Tell the user.

### 3. Task Sizing

Before diving in, mentally classify the task:

| Size   | Description                                         | Approach                                      |
| ------ | --------------------------------------------------- | --------------------------------------------- |
| **XS** | Typo fix, rename, single-line change                | Do it directly, no skill loading needed       |
| **S**  | Modify one component/service, add a translation key | Load relevant skill if pattern is non-obvious |
| **M**  | New component, new service, new route               | Load skill + read project AGENTS.md           |
| **L**  | Multi-file feature, cross-project change            | Consider using sub-agents via orchestrator    |
| **XL** | New library, major refactor, multi-domain feature   | Use orchestrator with full agent delegation   |

**Don't bring a cannon to a knife fight.** An XS task should not trigger skill loading, agent delegation, or orchestrator coordination.

---

## Session Knowledge Protocol

Long sessions produce valuable knowledge. Capture it so future sessions don't start cold.

### What to capture

- **Non-obvious constraints:** "Component X breaks if you remove NgModule Y because of Z"
- **Workarounds:** "Use `setTimeout` wrapper for signal X due to Angular change detection timing"
- **Hidden dependencies:** "Service A must be initialized before Service B — no error, just silent failure"
- **Architecture decisions:** "Team chose approach X over Y because of Z"
- **DO NOT capture:** standard patterns (already in skills), obvious things, session-specific temporary state

### Where to write it

| Knowledge type                      | Write to                 | Section              |
| ----------------------------------- | ------------------------ | -------------------- |
| Project-specific gotcha (1-2 lines) | Project's `AGENTS.md`    | `## Gotchas` section |
| Deeper explanation (>3 lines)       | Project's `KNOWLEDGE.md` | Relevant heading     |
| Cross-project pattern               | Root `AGENTS.md`         | `## Key Conventions` |

### When to write it

- **At natural breakpoints** in long sessions (feature completed, bug fixed, refactor done)
- **When explicitly asked** ("save what you learned", "update knowledge")
- **When you discover a gotcha** that would have saved time if you'd known it earlier
- **End of long sessions** — offer to update AGENTS.md with any discoveries

### KNOWLEDGE.md format

Each project may have a `KNOWLEDGE.md` alongside its `AGENTS.md`. Link it from AGENTS.md:

```markdown
## Deep Knowledge

For non-obvious patterns, workarounds, and architectural decisions, see [KNOWLEDGE.md](./KNOWLEDGE.md).
```

KNOWLEDGE.md entries should be:

- **Dated** (month/year is fine)
- **Titled** with the problem or topic
- **Actionable** — what to do or avoid, not just "here's what happened"

---

## Cross-Session Memory

A session store records every session's files, tools, and conversations. **Use it to avoid re-discovering what was already learned.**

Before starting work on a component or feature area, check if prior sessions touched the same files:

```
session_store_sql: SELECT sf.file_path, s.summary FROM session_files sf JOIN sessions s ON sf.session_id = s.id WHERE sf.file_path LIKE '%<component-or-feature-path>%' ORDER BY sf.first_seen_at DESC LIMIT 5
```

This is especially valuable for:

- Resuming work from a previous session ("I was working on X yesterday")
- Understanding why something was changed ("who modified this file recently?")
- Avoiding repeating failed approaches ("has this been tried before?")

Don't query the session store for every task — only when context from prior work would save time.

---

## Skills

### Critical Rules (always apply — no skill loading needed)

These are the most commonly violated patterns. Apply them on every Angular task without loading any skill file:

- **`ChangeDetectionStrategy.OnPush`** on every component — no exceptions.
- **`inject()`** instead of constructor injection — all new code.
- **`input()` / `output()`** signal APIs for new components — `@Input`/`@Output` decorators are legacy.
- **`styleUrl` (singular)**, not `styleUrls` (array) — since Angular 17.
- **Never hardcode English strings** — use the `translate` pipe or `TranslateService`.
- **Every SDK call needs an error path** — never ship a happy path without `catchError`.
- **`shareReplay(1)`** at the end of service pipelines, **after** `catchError`.
- **`takeUntilDestroyed()`** for subscription cleanup in components/directives.

### Full Skill Files

Load the full skill file **only when the task needs deep reference** — creating a new component from scratch, debugging a non-obvious issue, or when the critical rules above aren't enough.

| Skill                 | Trigger                                                                | File                                        |
| --------------------- | ---------------------------------------------------------------------- | ------------------------------------------- |
| **angular-patterns**  | Angular components, services, state, routes, guards, signals, inject() | `.github/skills/angular-patterns/SKILL.md`  |
| **rxjs-patterns**     | `.pipe()`, Subject, switchMap, combineLatest, stream debugging         | `.github/skills/rxjs-patterns/SKILL.md`     |
| **design-system**     | `nsi-*`/`pa-*` components, SCSS tokens, modals, toasts, tables, forms  | `.github/skills/design-system/SKILL.md`     |
| **api-sdk**           | Nuclia API, SDK, KnowledgeBox, RetrievalAgent, SDKService              | `.github/skills/api-sdk/SKILL.md`           |
| **error-handling**    | catchError, IErrorResponse, SisToastService, retry logic               | `.github/skills/error-handling/SKILL.md`    |
| **testing-patterns**  | `*.spec.ts`, TestBed, ng-mocks, Vitest, fixture.detectChanges()        | `.github/skills/testing-patterns/SKILL.md`  |
| **i18n-patterns**     | Translation keys, translate pipe, BabelEdit, locale files              | `.github/skills/i18n-patterns/SKILL.md`     |
| **nx-monorepo**       | nx commands, project.json, generators, module boundaries, tags         | `.github/skills/nx-monorepo/SKILL.md`       |
| **performance**       | @for loops, signal vs computed, lazy routes, shareReplay, debounce     | `.github/skills/performance/SKILL.md`       |
| **code-review**       | "review", "code review", "review this PR/diff/file"                    | `.github/skills/code-review/SKILL.md`       |
| **bug-finder**        | "find bugs", "check for bugs", "is this correct?"                      | `.github/skills/bug-finder/SKILL.md`        |
| **knowledge-sync**    | "sync knowledge", "update AGENTS.md", stale docs after commit/PR       | `.github/skills/knowledge-sync/SKILL.md`    |
| **agents-review**     | Review, create, or improve an AGENTS.md file                           | `.github/skills/agents-review/SKILL.md`     |
| **skill-creator**     | Create, improve, or evaluate a skill                                   | `.github/skills/skill-creator/SKILL.md`     |
| **product-knowledge** | Platform capabilities, API behaviour, feature feasibility              | `.github/skills/product-knowledge/SKILL.md` |
| **slack-bolt-py**     | Slack bot, Bolt for Python, slack-bolt                                 | `.github/skills/slack-bolt-py/SKILL.md`     |
| **teams-py-sdk**      | Teams bot, teams.py, microsoft-teams-apps                              | `.github/skills/teams-py-sdk/SKILL.md`      |

---

## Agents

Sub-agents run in **separate context windows** — use them for genuinely complex tasks, not for simple work that you can do directly in 2-5 tool calls.

### Model routing

Use the right model for each sub-agent to balance cost and quality:

| Role                                                                                         | Model  | Rationale                                  |
| -------------------------------------------------------------------------------------------- | ------ | ------------------------------------------ |
| **Info gathering** (explore, product-owner, knowledge-keeper)                                | Haiku  | Just reading files and docs — fast, cheap  |
| **Code generation** (ui-builder, test-writer, api-integrator, reactive-expert, infra-expert) | Sonnet | Needs code quality, but not deep reasoning |
| **Code review** (quality-inspector)                                                          | Sonnet | Pattern recognition and judgment           |
| **Coordination** (orchestrator)                                                              | Sonnet | Classification and routing                 |

Never use Opus for sub-agents — if a task needs Opus-level reasoning, the user will run it in the main conversation.

### When to use the orchestrator

Load `.github/agents/orchestrator.md` when the task:

- Touches more than one domain (UI + API, component + tests, etc.)
- Is described as "build a feature", "add end-to-end", or "create a tested component"
- Requires coordinating output from multiple specialists
- Is sized **L or XL** in the task sizing table

### Direct agent invocation (single-domain tasks)

For tasks sized **M** that are clearly single-domain, invoke the specialist directly:

| Task type                                      | Agent                                 |
| ---------------------------------------------- | ------------------------------------- |
| Angular UI, templates, SCSS, i18n              | `.github/agents/ui-builder.md`        |
| `*.spec.ts` files                              | `.github/agents/test-writer.md`       |
| API calls, SDK endpoints, Angular services     | `.github/agents/api-integrator.md`    |
| RxJS pipelines, signals, performance           | `.github/agents/reactive-expert.md`   |
| Code review, find bugs                         | `.github/agents/quality-inspector.md` |
| Nx build/test/serve, project.json, generators  | `.github/agents/infra-expert.md`      |
| Sync AGENTS.md and skill docs after commit/PR  | `.github/agents/knowledge-keeper.md`  |
| Platform domain questions, feature feasibility | `.github/agents/product-owner.md`     |

### When NOT to use agents

- **XS/S tasks:** Do the work directly. A rename, a one-line fix, or a simple translation key doesn't need agent delegation.
- **Tasks you can do in ≤5 tool calls:** Just do it yourself.
