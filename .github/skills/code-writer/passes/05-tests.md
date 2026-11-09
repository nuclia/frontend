# Pass 5 — Tests

**Goal:** Pin the behavior that needs pinning, nothing more.

## Do

- Add tests only for what `conventions › Tests` expects, and only when the
  code is not obvious and simple.
- Assert behavior (output, state), not implementation details.
- Put tests in the feature's single `<feature>.spec.ts`
  (`conventions › Spec files`), not in a new spec per file.
- Update existing specs touched by the change.

If nothing needs a test, say so in the hand-off in one line.
