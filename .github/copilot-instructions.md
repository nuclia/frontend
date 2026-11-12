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
| **L**  | Multi-file feature, cross-project change            | Use `ng-developer` for Angular code           |
| **XL** | New library, major refactor, multi-domain feature   | Use `ng-developer`, split into steps          |

**Don't bring a cannon to a knife fight.** An XS task should not trigger skill loading or agent delegation.

---

## Angular code

Use the `ng-developer` agent for writing and reviewing Angular code. Our rules
live in the `conventions` skill; do not duplicate them here.
