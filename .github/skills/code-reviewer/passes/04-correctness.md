# Pass 4 — Correctness & runtime behavior

**Question:** Can this break at runtime or with real user data?

## Load (optional)

`angular-developer` sections for what is touched (Reactivity and Data Management, Forms, Routing).

## Checklist

### Reactivity

- [ ] `effect` does not write signals it reads (loops) or compute derived state that belongs in `computed`
- [ ] Reads inside `untracked` / async callbacks are intentional; no stale-closure reads of signals
- [ ] Objects/arrays inside signals are replaced, not mutated in place (otherwise nothing updates)
- [ ] `computed` has no side effects
- [ ] `toSignal` has a correct `initialValue` / `requireSync`; no `subscribe` without teardown (`takeUntilDestroyed`, `toSignal`, async pipe)

### Async and errors

- [ ] Loading, error and empty states handled for `resource` / `httpResource` / calls; no silent failures
- [ ] UI does not assume data before it has loaded
- [ ] Out-of-order responses cannot overwrite newer state (switch-style cancellation / resource params)
- [ ] Optimistic updates are reverted on failure

### Templates

- [ ] Safe null/undefined handling for optional data
- [ ] `@for` `track` is stable and unique (not index for reorderable data)
- [ ] No expensive work or method calls that allocate on every change detection

### Logic

- [ ] Branches on role/state are complete (including loading and error paths)
- [ ] Dates/timezones, pagination, off-by-one
- [ ] Forms: validation and submit/disabled state consistent; no double submit
- [ ] Route params/guards/resolvers handle missing or invalid values
