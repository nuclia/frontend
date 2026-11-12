# Pass 6 — Verify & hand off

**Goal:** Prove it works and hand over a clear result.

## Do

- Run Prettier and lint on the touched files, type-check or `ng build`, and
  Vitest for the touched specs. Prefer Nx on the affected projects over
  whole-workspace runs. Fix what fails.
- Quick self-check against `code-reviewer` passes 1 and 2: conventions,
  placement, naming, no `any`, no excess comments.

## Hand-off message

- Changed files.
- Where the result differs from the pass 2 understanding, and any assumptions made.
- Checks run and their result; checks that could not be run.
- Suggest `code-reviewer` (it runs in a fresh context).
