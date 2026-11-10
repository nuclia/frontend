# Pass 6 — Tests & verification

**Question:** Is the behavior pinned, and how do we verify the diff?

## Load (optional)

`conventions` › Tests; `angular-developer` › Testing.

## Checklist

### Unit (Vitest)

Tests are expected only for the following, and only when the code is not obvious
and simple. Do not flag a missing test just because a file changed.

- [ ] vm services with business logic: new or changed behavior has a spec
- [ ] Utils / pure functions with branching or non-trivial logic have a spec
- [ ] App-wide code (resolvers, interceptors, guards) has a spec
- [ ] Bug fixes come with a regression test
- [ ] Existing specs touched by the change are updated: no stale expectations
- [ ] Tests assert behavior (output, state), not implementation details
- [ ] One `<feature>.spec.ts` per feature, not a spec per component, service or utils file (`conventions › Spec files`)
- [ ] Not flagged: presentational components, trivial pass-through code, constants, models, obvious one-liners

### E2E (Cypress)

- [ ] Changed critical user flows are covered by the critical-path set; do not demand e2e for trivial changes

### Verification (report, do not run)

List the commands the user should run for this diff, taken from the project's own scripts (root `package.json`), preferring Nx on affected projects:

- lint and Prettier for the touched files
- type-check / `ng build`
- Vitest for the touched specs (or affected projects)
- Cypress critical-path set when a critical flow changed

Gap severity: **should** / **consider**, unless the area already had tests and a regression is likely (**must**).
