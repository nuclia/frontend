---
name: code-reviewer
description: >
  Multi-pass review of Angular code changes (staged/unstaged/branch). One
  concept per pass internally (conventions → placement → architecture →
  correctness → security → tests); one consolidated report at the end, then a
  single fix gate. Use for "review Angular code", "review my Angular changes",
  or a pre-commit/PR check of changed files (components, services, templates,
  spartan UI).
---

# code-reviewer

Single reviewer, **sequential passes**, **one report**. Each pass checks **one
concept only** while collecting findings. Do not mix pass criteria. Do **not**
stop to report between passes — accumulate, then publish one consolidated report.

| Layer               | Role                                                                       |
| ------------------- | -------------------------------------------------------------------------- |
| `passes/0N-*.md`    | Checklist for the current pass only                                        |
| `conventions`       | Our structure, state, naming, TypeScript, imports, tests. Wins on conflict |
| `angular-developer` | Generic Angular best practice, via its `references/*.md`                   |
| `spartan`           | UI library rules, via its `rules/*.md`                                     |

Passes point to these skills; they do not restate them. Read the current pass
file before reviewing that pass, and open the referenced skill file only when a
checklist item needs it.

## When to use

- User asks to review Angular changes before commit or merge.
- User says "continue review" / "fix …" (resume from the report in the conversation).

Default diff scope: **uncommitted changes** (staged + unstaged). Use the branch
diff against the default branch when the user says "review branch".

## Pass order (always this sequence)

| #   | File                                                   | Concept                                                         |
| --- | ------------------------------------------------------ | --------------------------------------------------------------- |
| 1   | [passes/01-conventions.md](passes/01-conventions.md)   | Our patterns: state, naming, TypeScript, styling, spartan usage |
| 2   | [passes/02-placement.md](passes/02-placement.md)       | Folders, file roles, vm services, import boundaries             |
| 3   | [passes/03-architecture.md](passes/03-architecture.md) | Boundaries, DRY, KISS                                           |
| 4   | [passes/04-correctness.md](passes/04-correctness.md)   | Bugs, reactivity, runtime                                       |
| 5   | [passes/05-security.md](passes/05-security.md)         | Client-side security                                            |
| 6   | [passes/06-tests.md](passes/06-tests.md)               | Tests and verification                                          |

**Skip a pass** when the diff has no relevant surface. Note it under **Skipped**
in the final report (one line each) and keep going.

## Core rules

1. **One concept per pass.** While on pass 2, do not collect pass 4 bugs.
2. **Read-only until the fix gate.** No edits while running passes or writing the report.
3. **Every finding cites a source:** a `conventions` section, an
   `angular-developer` reference, a `spartan` rule file, or a concrete bug.
   Nothing else is reported. No personal style preferences.
4. **Never report formatting or import order/grouping.** Prettier and the import
   tooling own them. Import-related correctness bugs (circular imports,
   boundary violations) stay in scope.
5. **Review only what the diff changes.** Ignore pre-existing issues unless the
   diff makes them worse. No refactor proposals beyond the diff.
6. **Chunk large diffs:** max 8 changed files per chunk within a pass. Finish
   all chunks of a pass before the next pass.
7. **Full file context.** Read each file in a chunk completely, not only the hunks.
   Verify every finding by reading the cited line; never report from grep alone.
8. **Silent accumulation.** Keep findings privately between passes. Do not post a
   pass report or end the turn between passes.
9. **Fix scope.** Fix only the items the user selected. No drive-by changes.

## Workflow

### A. Prepare (once)

Run in parallel from the repository root:

```bash
git status --short
git diff --cached
git diff
```

Branch review: `git diff <default-branch>...HEAD --stat` and the full diff.
If the default branch is unclear, ask.

Build the changed Angular files list (dedupe staged + unstaged) and group it
into chunks by feature folder (max 8 files each).

### B. Run passes 1…6 without reporting

For each pass: read its file, then for each chunk read the full files and append
findings that match **this pass only** (tag each with the pass id). Dedupe within
the pass. If nothing applies, mark the pass skipped and continue.

### C. Consolidated report (once)

1. Number findings globally `#1…#N` across passes (so `fix 1, 3` works).
2. Post the full report in the reply (format below).
3. **Stop.** Do not edit code. Do not use a question form for the fix gate.

### D. Fix gate (user replies in chat)

| User says                                     | You do                                                                                                               |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `fix must` / `fix must + should` / `fix 1, 3` | Fix only those items, then run the project's type-check/lint and Prettier on touched files, list changed files, stop |
| `skip fixes` / `stop` / `good enough`         | End the review                                                                                                       |

Do not re-run all passes after fixes unless asked.

## Report format

```markdown
## Code review (complete)

<scope: e.g. uncommitted · 14 files · 3 chunks>

### Pass 1 — Conventions

| #   | Severity | Location  | Issue        | Source                         | Suggested fix |
| --- | -------- | --------- | ------------ | ------------------------------ | ------------- |
| 1   | must     | path:line | one sentence | conventions › State management | one sentence  |

✅ No issues for this pass.

### Pass 2 — Placement

…

**Totals:** X must, Y should, Z consider
**Skipped:** Pass 5 — no security-sensitive surface in diff
```

Show `✅ No issues for this pass.` for every pass that ran and found nothing.
If there are zero issues overall, still list every pass (or Skipped) plus
`✅ No issues in diff.`. No code blocks in the report unless asked; prefer
`path:line` + short text. End with one line: _Reply with what to fix (`fix must`,
`fix 1 and 2`) or `skip fixes` / `stop`._

**Severity** (same in every pass):

- **must** — breaks a `conventions` rule, a bug, or a security issue
- **should** — clear deviation from `angular-developer`/`spartan` guidance, or DRY/KISS
- **consider** — optional polish, and any threshold marked "usually" in `conventions`
  (e.g. 80+ line component, 500+ line service)

## Fresh context

If this conversation already contains the work being reviewed and a subagent
tool is available, run the review in a **fresh subagent**. Pass only the scope
(uncommitted or branch + base), not the plan or rationale, and relay its report
unchanged; the fix gate stays here. Without a subagent tool, review in place.

## As a subagent

Run all passes unless the parent scopes it (`pass 3 only`). Post the report and
stop. If told "fix must from the review", apply those items only.
