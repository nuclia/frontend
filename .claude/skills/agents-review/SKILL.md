---
name: agents-review
description: Reviews and refactors AGENTS.md files in the Nuclia frontend monorepo for completeness, accuracy, and AI-agent usability. Invoke this skill whenever you are working with an AGENTS.md file in apps/ or libs/, when asked to review or improve agent documentation, when creating a new AGENTS.md for a project, or when you notice that an AGENTS.md seems outdated, thin, or missing. Proactively suggest a review even when the user only asks an unrelated question about a project if no AGENTS.md exists for it.
---

# AGENTS.md Review & Refactor

AGENTS.md files are persistent memory for AI coding agents. A strong AGENTS.md lets any agent (Claude, Copilot, Cursor, etc.) become productive in a project within seconds — without having to rediscover architecture, conventions, or gotchas by reading the source. Poor files waste tokens and lead to hallucinated APIs or broken conventions.

Your job: read the target AGENTS.md alongside the actual source code it describes, identify gaps and inaccuracies, then rewrite it in-place. The goal is a file that would let a brand-new agent make a correct change to this project without any other context.

---

## Workflow

1. **Identify the target.** If the user names a project, locate its AGENTS.md at `apps/<name>/AGENTS.md` or `libs/<name>/AGENTS.md`. If they point at a file, use that. If the file doesn't exist yet, create it from scratch.
2. **Read the source.** Skim `src/` — routing files, core services, state files, `project.json` — to verify claims and discover omissions. Don't rely solely on what the AGENTS.md currently says.
3. **Evaluate against the criteria below.** Note every gap before writing, so you fix everything in one pass rather than back-and-forth.
4. **Rewrite in-place.** Save the improved file directly — no diffs, no side-by-side comparisons.
5. **Report.** After saving, write a concise summary of what changed and why (see output format at the bottom).

---

## Evaluation Criteria

These are the things that make an AGENTS.md genuinely useful. For each area, ask yourself: "if an agent read only this section, could it work confidently in this part of the code?"

### Identity & Purpose
The first thing an agent reads should tell it exactly what this project is. Include the tech stack (Angular/Svelte/Vite/plain JS), the single-sentence purpose, the Nx project name, and the exact run commands (`nx serve`, `nx build`, `nx test`, `nx lint`). Without run commands, the agent has to hunt through `project.json` every time.

### Architecture & Structure
Describe the module or component tree well enough that an agent knows where to add a new feature without reading every file. For Angular apps, document the full routing hierarchy including lazy-loaded modules — agents use the route tree to map URLs to components. For Svelte/Vite apps, show entry points and the component hierarchy. List the shared libs this project consumes with their import alias (e.g., `@nuclia/core`, `@nuclia/sistema`).

### State & Data Flow
Name the state management approach (NgRx, RxJS subjects, Angular signals, Svelte stores). List key services with one-line descriptions of their responsibilities. Describe the API integration layer: which SDK class is used, what the base URL is, and how auth works. An agent that doesn't understand state ownership will put things in the wrong place.

### Conventions
Document file/folder naming conventions (e.g., `*.state.ts` for signal stores, `*.models.ts` for types), the component selector prefix (e.g., `app-`, `nad-`, `pa-`), and the CSS/SCSS approach — especially where design tokens come from. Without these, an agent will create files with wrong names or wrong selectors.

### Testing
State the test runner and exact command (`nx test <name>`), the test file convention (`*.spec.ts` co-located, etc.), and any environment variables or global mocks required. An agent that doesn't know the test setup will write tests that don't run.

### Gotchas & Non-obvious Patterns
This is often the most valuable section. Explain any pattern that looks wrong but is intentional — an agent without this context will "fix" it. Examples from this repo: hash routing in `nucliadb-admin` (required by the deployment environment), signal-based workflow state in `rao` and `dashboard` (intentional architectural choice). Also document feature flags with their defaults if the project uses them.

### Freshness
Every file path, class name, and method name in the document should exist in the actual source. Stale references are worse than no documentation — they actively mislead. Check them.

---

## Content ROI — What to Include vs. What to Skip

Every token in an AGENTS.md is loaded on demand. Content must earn its place.

**Key question:** "Can an agent discover this in under 5 seconds by reading the source?" If yes, skip it.

### High ROI — Always Include

- **Non-obvious invariants and runtime constraints** — Things that look like bugs but are intentional: singleton enforcement, mutual exclusions that throw at runtime, attribute name remappings (e.g. `kbstate` → `state`), required initialisation order.
- **Custom architecture patterns unique to this project** — The `SvelteState<STATE>` store pattern, `effects.ts`-only subscription rule, `WritableKnowledgeBox` vs `KnowledgeBox` split. Conventions an agent cannot infer from file names alone.
- **Guards** — List every guard with what condition it enforces. Agents will accidentally route around guards they don't know about.
- **File structure tree with one-line annotations** — Agents use this to know where to add files without reading every directory.
- **Run commands** — `nx serve`, `nx test`, `nx build` with the exact project name. Agents hunt `project.json` every time without this.
- **Flag interactions and mutual exclusions** — e.g. `semanticOnly` and `relations` are mutually exclusive and throw at `initNuclia` time. Cannot be found without running code.
- **Intentional divergence from workspace norms** — Hash routing in `nucliadb-admin`, Svelte 5 runes coexisting with Svelte 3 in the same lib, eslint-disable on intentional circular imports.
- **Critical API usage distinctions** — When to use `db.getKnowledgeBox()` vs `nuclia.knowledgeBox`, when `synchronous: true` is needed, why `ask()` emits multiple values and how to get the final answer.

### Low ROI — Skip These

- **Method signature tables** — The agent reads `*.ts` source directly. Listing every method parameter adds nothing.
- **Model / interface property lists** — The agent reads `*.models.ts`. Property tables are pure duplication.
- **Constants and enum value lists** — Greppable in under 2 seconds.
- **External dependency tables** — The agent reads `package.json`.
- **Integration tutorials / README content** — Usage examples for external consumers belong in `README.md`. AGENTS.md is for contributors, not integrators.
- **Public API re-export indexes** — If a barrel re-exports 50 symbols, listing all 50 is duplication. Note the barrel and the categories it exports.
- **Boilerplate descriptions** — "This component renders the UI for X" where X is already the file name.

### Token Budget Targets

| Project type | Target | Max |
|---|---:|---:|
| Small lib (< 10 source files) | ~1,000 tokens | 2,000 |
| Medium lib or app | ~2,000 tokens | 4,000 |
| Large lib (`libs/common`, `libs/core`) | ~3,000 tokens | 5,500 |
| SDK / standalone package | ~2,500 tokens | 4,500 |

Files above max are almost certainly duplicating source. Keep conventions and structure; cut method tables.

---

## Things to Watch For

**Vague descriptions** — "manages state" is useless. "WorkflowService holds an array of `WorkflowNode` objects and exposes `addNode(type)` / `removeNode(id)`" is useful. Always name actual symbols.

**Missing routing tree** — The most common gap in Angular app docs. Reconstruct it from `*-routing.module.ts` files.

**Orphaned headings** — A section heading with one generic sentence under it gives false confidence. Either add real content or remove the section.

**Missing guards** — Guards encode access rules that agents will accidentally circumvent if they don't know about them. List every guard and what condition it enforces.

**Undocumented feature flags** — For `search-widget`, `rao`, and `dashboard`: list feature flags with their defaults. An agent that doesn't know the flags exist will change behaviour inadvertently.

---

## Monorepo-Specific Context

This is an Nx monorepo. Every AGENTS.md here should document only what is unique to its project — the following facts are repo-wide and don't need repeating in every file:

- **Nx config**: `project.json` in each app/lib root defines targets
- **Path aliases**: `tsconfig.base.json` maps `@nuclia/*` and `@guillotinaweb/*`
- **Design system**: `libs/sistema` (`@nuclia/sistema`) for current UI; `libs/pastanaga-angular` for legacy components
- **Primary SDK**: `libs/sdk-core` → `@nuclia/core`
- **Web components**: `libs/search-widget` (Svelte), `libs/rao-widget` (Angular wrapper)
- **State conventions**: `*.state.ts` = Angular signal store; older RxJS services still common
- **i18n**: `@guillotinaweb/pastanaga-angular` translation bridge; `.po`/`.pot` files in `src/assets/i18n/`

---

## Writing Style

Write in present tense and imperative form. Name actual symbols rather than describing concepts. Prefer flat bullet lists over nested prose for cataloguing components, services, or guards — agents scan, they don't read. Keep each section independently useful. If you don't know a value, omit the field rather than writing "TBD".

---

## Output Format

After saving the updated AGENTS.md, output a review summary in the conversation (not inside the file):

```
## Review Summary: <project>

### Changed
- <what changed and why, one bullet per meaningful edit>

### Verified accurate
- <sections that were already correct>

### Could not verify
- <anything requiring app execution or insider knowledge>
```
