# Pass 1 — Enrich

**Goal:** Gather the facts needed to build the right thing. Read-only.

## Do

- Load `conventions`.
- Read every file, ticket or link the task mentions.
- Find similar existing code (components, vm services, utils) in the Angular
  apps/libs, and follow it where it matches `conventions`; legacy code that
  does not match is not a pattern to copy.
- **API contract**, when the feature calls the API: read the SDK (`libs/sdk-core`),
  the `api-sdk` skill and the API specs it points to. Never guess endpoints
  or field names.
- **Existing behavior**, when changing a feature: read the current
  implementation. It is the behavioral spec: states, validations, edge cases.
- **UI**, when there is any: check installed spartan components with the CLI info
  and use any design reference the user gave.

## Output

Private notes: facts with file paths, and what is still unknown. Stop when you
have enough; do not tour the repository. Carry unknowns into pass 2.
