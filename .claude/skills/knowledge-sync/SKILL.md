---
name: knowledge-sync
description: >
  Keeps all AI-agent documentation in sync with the codebase: root AGENTS.md, per-project
  AGENTS.md files in apps/ and libs/, and knowledge embedded in .claude/skills/ and
  .claude/agents/. Activate this skill when the user mentions syncing docs after a PR or
  commit, asks "what docs need updating?", says "update knowledge", references a big feature
  that just landed ("there was a big update in commit X"), or runs the staleness check script
  and sees stale files. Also activate proactively when you notice an AGENTS.md file is missing
  for a project that was just created, or when a skill references a pattern that no longer
  matches the source code. Do NOT wait for the user to explicitly say "knowledge sync" — if
  code has changed and docs might be stale, this skill applies immediately.
---

# Knowledge Sync

The goal is to keep every piece of AI-agent documentation accurate and up-to-date so that any
agent can work confidently in any project without re-discovering facts that are already known.

**Three layers of documentation to maintain:**

1. **Root `AGENTS.md`** — workspace-wide: apps list, libs list, run commands, shared conventions
2. **Per-project `AGENTS.md`** — in `apps/<name>/` and `libs/<name>/`: routing, services, state, gotchas
3. **Skills & agents** in `.claude/skills/` and `.claude/agents/` — patterns, idioms, workflows

---

## Workflow

### Step 1 — Determine Scope

Ask yourself (or confirm with the user) which of these applies:

| Scope                  | When to use                                      | Git command                           |
| ---------------------- | ------------------------------------------------ | ------------------------------------- |
| **Single commit**      | User names a commit hash                         | `git show <hash> --name-only`         |
| **Branch diff**        | Reviewing a PR or feature branch                 | `git diff main...HEAD --name-only`    |
| **Full audit**         | Periodic maintenance or "everything feels stale" | Run the staleness script (see Step 2) |
| **Just new apps/libs** | After a scaffold-only change                     | Check for missing AGENTS.md files     |

Default to `git diff main...HEAD --name-only` if no explicit scope is given.

### Step 2 — Detect Staleness

Run the staleness check script to find outdated docs:

```bash
.claude/skills/knowledge-sync/scripts/check-staleness.sh
```

Or manually: for each project, check if its AGENTS.md is older than the newest source file:

```bash
# Check a specific project
find apps/auth/src -newer apps/auth/AGENTS.md -name "*.ts" 2>/dev/null | head -5

# Find projects with no AGENTS.md at all
for dir in apps/*/  libs/*/; do
  [ ! -f "${dir}AGENTS.md" ] && echo "MISSING: ${dir}AGENTS.md"
done
```

### Step 3 — Build the Staleness Map

Given the list of changed files, populate this map:

| Changed path                  | Documentation to update                                                  | Priority |
| ----------------------------- | ------------------------------------------------------------------------ | -------- |
| `apps/<X>/` (new folder)      | Create `apps/<X>/AGENTS.md` + add row to root `AGENTS.md`                | CRITICAL |
| `apps/<X>/src/app/*routing*`  | Update routing tree in `apps/<X>/AGENTS.md`                              | HIGH     |
| `apps/<X>/src/app/*guard*`    | Update guards section in `apps/<X>/AGENTS.md`                            | HIGH     |
| `apps/<X>/src/app/*.state.ts` | Update state section in `apps/<X>/AGENTS.md`                             | HIGH     |
| `apps/<X>/` (general changes) | Review `apps/<X>/AGENTS.md` for accuracy                                 | MEDIUM   |
| `libs/<X>/` (new folder)      | Create `libs/<X>/AGENTS.md` + add row to root `AGENTS.md`                | CRITICAL |
| `libs/<X>/` (general changes) | Review `libs/<X>/AGENTS.md`                                              | MEDIUM   |
| `libs/sdk-core/src/lib/`      | Review `.claude/skills/api-sdk/SKILL.md` for stale API patterns          | HIGH     |
| `libs/sistema/`               | Review `.claude/skills/design-system/SKILL.md` for stale component names | MEDIUM   |
| `libs/pastanaga-angular/`     | Review `.claude/skills/design-system/SKILL.md`                           | MEDIUM   |
| `libs/user/` auth flows       | Review `.claude/skills/angular-patterns/SKILL.md` auth section           | MEDIUM   |
| `libs/user/src/assets/i18n/`  | Review `.claude/skills/i18n-patterns/SKILL.md`                           | LOW      |
| New file in `.claude/skills/` | Update `.github/copilot-instructions.md` skills list                     | CRITICAL |
| New file in `.claude/agents/` | Update `.github/copilot-instructions.md` agents list                     | CRITICAL |
| `charts/` or `docker/`        | Review root `AGENTS.md` deployment section if one exists                 | LOW      |

#### Product Knowledge Staleness

The `product-knowledge` skill has an **external** source of truth — the docs repo and API specs.
It does **not** use git diffs from the frontend monorepo to detect staleness. Check it separately.

**The docs repo is expected at `../docs` (sibling to the frontend repo). If it does not exist, skip the docs-repo check entirely** — only update API specs.

```bash
# 1. Check if docs repo exists and has new commits since last sync
LAST_COMMIT=$(python3 -c "import json; d=json.load(open('.claude/skills/product-knowledge/meta.json')); print(d['docs_repo']['last_commit'])")
if [ -d "../docs" ]; then
  cd ../docs && git fetch && git log ${LAST_COMMIT}..origin/main --oneline
  cd -
else
  echo "docs repo not found at ../docs — skipping docs staleness check"
fi

# 2. Check if API specs have changed (ETag comparison, always runs)
for spec in global nua nucliadb zone; do
  STORED=$(python3 -c "import json; d=json.load(open('.claude/skills/product-knowledge/meta.json')); print(d['api_specs']['${spec}']['etag'])")
  CURRENT=$(curl -sI "https://cdn.rag.progress.cloud/api/${spec}/v1/api.yaml" | grep -i 'etag:' | tr -d '\r' | awk '{print $2}')
  echo "${spec}: stored=${STORED} current=${CURRENT}"
done
```

If the docs repo has new commits **or** any API spec ETag differs:

| Stale source                                                               | Action                                           | Priority |
| -------------------------------------------------------------------------- | ------------------------------------------------ | -------- |
| Docs repo: new commits touching `docs/agentic/`                            | Update `references/agentic-rag.md`               | HIGH     |
| Docs repo: new commits touching `docs/rag/`                                | Update `references/search-and-rag.md`            | HIGH     |
| Docs repo: new commits touching `docs/ingestion/`                          | Update `references/ingestion.md`                 | HIGH     |
| Docs repo: new commits touching `docs/management/`                         | Update `references/management.md`                | MEDIUM   |
| Docs repo: new commits touching `docs/rag/llms.md` or `advanced/models.md` | Update `references/llms-and-models.md`           | MEDIUM   |
| API spec ETag changed (`global`)                                           | Re-download `references/api-specs/global.yaml`   | HIGH     |
| API spec ETag changed (`nua`)                                              | Re-download `references/api-specs/nua.yaml`      | HIGH     |
| API spec ETag changed (`nucliadb`)                                         | Re-download `references/api-specs/nucliadb.yaml` | HIGH     |
| API spec ETag changed (`zone`)                                             | Re-download `references/api-specs/zone.yaml`     | HIGH     |

After updating, **always** refresh `meta.json` with the new commit hash, ETags, and `updated_at`:

```bash
# Update docs_repo.last_commit
cd ../docs && git rev-parse HEAD

# Update API spec ETags
curl -sI "https://cdn.rag.progress.cloud/api/{spec}/v1/api.yaml" | grep -i etag
```

Also update the "last updated" references in `SKILL.md`'s "Keeping This Skill Up-to-Date" section.

### Content ROI Quick Reference

Use this when deciding what belongs in an AGENTS.md. The full detailed framework lives in
`.claude/skills/agents-review/SKILL.md`, but these criteria cover the most common decisions.

**Core test:** "Can an agent discover this in under 5 seconds by reading the source? If yes, skip it."

#### High ROI — Always Include

- **Non-obvious invariants and runtime constraints** — things that look like bugs but are intentional
- **Custom architecture patterns unique to the project** — not inferable from filenames alone
- **Guards with their enforced conditions** — agents will accidentally route around unknown guards
- **File structure tree with one-line annotations**
- **Run commands** — `nx serve/test/build` with the exact project name
- **Flag interactions and mutual exclusions** — cannot be found without running code
- **Intentional divergence from workspace norms** — hash routing, eslint-disable on purpose, etc.
- **Critical API usage distinctions** — when to use one method vs another, why something emits multiple values

#### Low ROI — Skip These

- **Method signature tables** — agents read source directly
- **Model/interface property lists** — duplication of `*.models.ts`
- **Constants and enum value lists** — greppable in under 2 seconds
- **External dependency tables** — already in `package.json`
- **Integration tutorials / README content** — AGENTS.md is for contributors, not integrators
- **Public API re-export indexes** — note the barrel and categories, don't list all symbols
- **Boilerplate descriptions redundant with filenames**

#### Token Budget Targets

| Project type                           |        Target |   Max |
| -------------------------------------- | ------------: | ----: |
| Small lib (< 10 source files)          | ~1,000 tokens | 2,000 |
| Medium lib or app                      | ~2,000 tokens | 4,000 |
| Large lib (`libs/common`, `libs/core`) | ~3,000 tokens | 5,500 |

Files above max almost certainly duplicate source. Keep conventions and structure; cut method tables.

### Step 4 — Execute Updates

Work through the staleness map from **CRITICAL → HIGH → MEDIUM → LOW**.

#### 4a. New project — create AGENTS.md

If a new app or lib was created and has no AGENTS.md:

1. Read the project's `project.json`, routing files, main module/component tree, and key services
2. Write the file from scratch, applying the **Content ROI Quick Reference** above — include high-ROI items (guards, structure tree, run commands, non-obvious constraints), skip low-ROI items (method tables, model lists, dependency tables). Use the `agents-review` skill for the full evaluation framework if needed.
3. Then add a row for the project in the root `AGENTS.md` apps or libs table

#### 4b. Existing project — update AGENTS.md

If source files changed in a project that already has an AGENTS.md:

1. Read the diff for that project: `git diff <scope> -- apps/<X>/`
2. Read the current `apps/<X>/AGENTS.md`
3. Identify which facts are now wrong or missing (routing changes, renamed services, new guards)
4. Edit the file in-place — do not rewrite sections that are still accurate
5. Verify every class name, method name, and file path mentioned still exists in source
6. Apply the **Content ROI Quick Reference** above — actively remove any low-ROI content (method signature tables, model property lists, dependency tables, integration tutorials) that snuck in. Use the `agents-review` skill for the full evaluation framework if the file needs a deeper overhaul.

#### 4c. Skills and agents — update inline knowledge

If a skill's documented patterns no longer match the source, update that skill directly.
Key signals that a skill is stale:

- A class or method name it references was renamed (check with `grep -r "OldName" src/`)
- A route path it documents was changed
- A new pattern was introduced that contradicts the skill's guidance (e.g. new state management approach)
- An import alias was changed in `tsconfig.base.json`

Do NOT rewrite skills speculatively — only update what is verifiably wrong.

#### 4d. Root AGENTS.md

The root `AGENTS.md` needs updating when:

- A new app or lib is added (add a row to the table)
- An app is removed or renamed (update the table)
- A workspace-wide convention changes (e.g. switching test runner, changing package manager)
- Running commands change (ports, build commands, etc.)

### Step 5 — Report

After completing updates, produce a concise summary:

```
## Knowledge Sync Report

**Scope:** <commit hash / branch / full audit>
**Changed projects detected:** <comma-separated list>

### Created
- <file path> — <one line reason>

### Updated
- <file path> — <what changed>

### Verified accurate (no changes needed)
- <file path>

### Skipped / Could not verify
- <file path> — <reason>

### Automation reminder
<Any files still stale that require manual verification, e.g. skill files that may reference
outdated patterns but the change was too subtle to verify automatically.>
```

---

## Source-to-Docs Mapping Reference

Use this when you need to reason about which skill or agent is the authoritative owner of a
given piece of knowledge:

| Source of truth                      | Authoritative doc                                                  |
| ------------------------------------ | ------------------------------------------------------------------ |
| `libs/sdk-core/src/lib/`             | `.claude/skills/api-sdk/SKILL.md`                                  |
| `libs/sistema/`                      | `.claude/skills/design-system/SKILL.md`                            |
| `libs/pastanaga-angular/`            | `.claude/skills/design-system/SKILL.md`                            |
| `libs/user/` (auth flows)            | `.claude/skills/angular-patterns/SKILL.md` + `apps/auth/AGENTS.md` |
| `*.state.ts` patterns                | `.claude/skills/angular-patterns/SKILL.md`                         |
| `*.spec.ts` patterns                 | `.claude/skills/testing-patterns/SKILL.md`                         |
| RxJS usage in services               | `.claude/skills/rxjs-patterns/SKILL.md`                            |
| `libs/*/src/assets/i18n/`            | `.claude/skills/i18n-patterns/SKILL.md`                            |
| `nx.json`, `project.json`            | `.claude/skills/nx-monorepo/SKILL.md`                              |
| App routing trees                    | Per-project `AGENTS.md` routing section                            |
| Guards                               | Per-project `AGENTS.md` gotchas/guards section                     |
| Feature flags                        | Per-project `AGENTS.md` gotchas section                            |
| `../docs` repo                       | `.claude/skills/product-knowledge/SKILL.md` + its `references/`    |
| API specs (global/nua/nucliadb/zone) | `.claude/skills/product-knowledge/references/api-specs/`           |

---

## Workspace Indexing

VS Code can index the workspace to help Copilot find code it hasn't seen.
This is **complementary** to AGENTS.md, not a replacement:

| Feature                         | Workspace Index          | AGENTS.md               |
| ------------------------------- | ------------------------ | ----------------------- |
| Finds any symbol by name        | ✅                       | ❌                      |
| Understands architecture intent | ❌                       | ✅                      |
| Knows routing tree              | ❌ (infers poorly)       | ✅                      |
| Knows non-obvious gotchas       | ❌                       | ✅                      |
| Knows which guard enforces what | ❌                       | ✅                      |
| Costs tokens per query          | Yes (reads file content) | No (already in context) |

**Recommendation:** Enable workspace indexing — it helps Copilot resolve symbols it cannot find
from context alone. But never rely on it for architectural or convention knowledge; that belongs
in AGENTS.md. Well-written AGENTS.md files reduce token usage by providing curated facts
instead of requiring the AI to scan source files on every turn.

---

## Automation: Never Forget to Sync

Run the git hook installer to get automatic staleness reminders after every `git pull` or merge:

```bash
.claude/skills/knowledge-sync/scripts/install-hooks.sh
```

What the hook does:

1. After `git pull` or `git merge`, runs the staleness check
2. If stale docs are found, prints a specific list to the terminal
3. Does NOT block your workflow — just prints a reminder

To trigger a full knowledge sync manually:

```bash
# Check what's stale
.claude/skills/knowledge-sync/scripts/check-staleness.sh

# Then ask Claude: "run knowledge sync for commit <hash>"
# or: "run knowledge sync for the current branch diff"
```

You can also add a VS Code task — see `.claude/skills/knowledge-sync/scripts/vscode-task.json`
for a ready-made task definition to drop into `.vscode/tasks.json`.

---

## Common Patterns to Watch For

When reviewing changed diffs for knowledge-impacting changes, look for:

- **New `app.module.ts` or new standalone `app.component.ts`** → new app bootstrapped
- **New `*-routing.module.ts` or `Routes` array changes** → routing tree changed
- **New `*.guard.ts`** → guards section needs updating
- **New `*.state.ts` or new `BehaviorSubject` fields** → state section may need updating
- **Changes to `index.ts` barrel exports** → public API of a lib changed
- **New `environment*.ts` files** → environment configuration may have changed
- **Changes to `tsconfig.base.json` paths** → path aliases changed, update root AGENTS.md
- **New `i18n/*.json` keys** → check i18n-patterns skill if key naming convention changed
- **New `@NgModule` or removal of `@NgModule`** → module architecture changed
