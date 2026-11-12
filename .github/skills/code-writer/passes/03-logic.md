# Pass 3 — Logic

**Goal:** The behavior works and is correct. No template yet.

## Do

- vm service, state (signals), data access and models/utils, per `conventions`.
- Start with `component.ts` only. Split incrementally per
  `conventions › Split incrementally`: non-UI code to `.service.ts` when the
  component grows, then `.utils.ts` / `.model.ts` when the service grows.
- Use the real API shape from pass 1; type it, no `any`.
- Handle loading, error and empty states, and invalid or missing data.
- Bug fix: write the failing regression test first.

## Check before moving on

- The logic does what pass 2 said, nothing more.
- No leftover comments, no unused code.
