# Pass 3 — Architecture, DRY & KISS

**Question:** Are feature boundaries respected, and is the complexity justified?

## Load

`conventions` (Code structure, Imports).

## Checklist

### Boundaries

- [ ] Features grow independently: no reaching into another feature's internal files (components, vm, utils); shared things are promoted to a lib
- [ ] Components stay thin: business logic and state live in the vm service, not in the component or template expressions

### DRY

- [ ] Same map, list, constant, string or union duplicated → one `.utils.ts` / `.model.ts`, or a lib when cross-feature
- [ ] Same logic (mapping, filtering, validation, formatting, loading/error handling) copy-pasted across components or vm services → shared function or service
- [ ] Same block of markup or long class string repeated, or near-identical components differing by an input → one component
- [ ] New helper or service that Angular or an existing one in the app/lib already provides

### KISS

- [ ] No abstraction used once (generic wrapper, factory, base class, token)
- [ ] RxJS pipelines that a `computed` / `resource` would express more simply
- [ ] `effect` / `computed` / `linkedSignal` chains that are hard to follow — prefer one clear signal
