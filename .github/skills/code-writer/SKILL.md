---
name: code-writer
description: >
  Writes Angular code (components, vm services, templates with spartan, utils,
  tests) following our conventions, in six passes: enrich → understand → logic →
  UI → tests → verify. Use for "write/add/implement/fix/refactor" tasks.
---

# code-writer

Write Angular code the way `code-reviewer` will check it, so the review finds
little. Sequential passes, one concept each. Read the current pass file before
doing that pass.

| Skill               | Use                                                  |
| ------------------- | ---------------------------------------------------- |
| `conventions`       | Our rules; wins on conflict. Load in pass 1          |
| `angular-developer` | Generic Angular guidance; open the section you need  |
| `spartan`           | UI components; open the rule file for what you build |

## Pass order (always this sequence)

| #   | File                                               | Concept                                              |
| --- | -------------------------------------------------- | ---------------------------------------------------- |
| 1   | [passes/01-enrich.md](passes/01-enrich.md)         | Gather facts: code, API contracts, existing behavior |
| 2   | [passes/02-understand.md](passes/02-understand.md) | State the task back, plan, ask what is blocking      |
| 3   | [passes/03-logic.md](passes/03-logic.md)           | vm service, state, data access, models               |
| 4   | [passes/04-ui.md](passes/04-ui.md)                 | Template, spartan, Tailwind                          |
| 5   | [passes/05-tests.md](passes/05-tests.md)           | Tests where they are expected                        |
| 6   | [passes/06-verify.md](passes/06-verify.md)         | Checks, self-review, hand-off                        |

## Rules

- **Right-size.** A rename or text fix goes straight to pass 3. Skip passes that
  do not apply without announcing them. Passes 1 and 2 are never skipped for a
  new feature.
- **No code before pass 3.** Passes 1 and 2 are read-only.
- **Stop only at pass 2** (blocking questions, or non-trivial work awaiting
  confirmation) and at the end. Otherwise keep going.
- No comments by default; only a short note for a kludge or hack
  (`conventions › Comments`).
- Create only the files the component needs.
- Stay in scope: no drive-by refactors; mention unrelated problems instead.
- Never skip verification; report what ran and what could not run.
