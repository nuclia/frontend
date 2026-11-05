# Pass 2 — Placement & file structure

**Question:** Is the right code in the right file and folder, and are import boundaries respected?

Patterns inside the code (signals, naming, spartan) are pass 1.

## Load

`conventions` (Code structure, Imports).

## Checklist

### Folders

- [ ] Each feature in its own `<feature>/` folder; each component in its own `<component>/` folder
- [ ] Subcomponents inside the `<feature>` folder — no deep nesting (2-3 levels; **consider** above that)
- [ ] `<feature>` / component names are understandable to a developer; sibling components show their hierarchy in their names
- [ ] Directory size stays reasonable (about 10-20 entries; **consider** above)

### Component files

- [ ] Every component has `<name>.component.ts` and `<name>.component.html` (`<name>` = its folder); inline template only for a one-liner
- [ ] Split incrementally: no empty-shell or few-line `.service.ts` / `.utils.ts` / `.model.ts` on a small component or service
- [ ] `component.ts` that grew too large (usually 80+ lines; **consider**) and does not split into meaningful sub-components: non-UI code moved to `.service.ts`
- [ ] `service.ts` that grew (usually 80+ lines; **consider**): constants, config and pure functions in `.utils.ts`, types in `.model.ts`
- [ ] Right content in the right file:
  - `.service.ts` — business logic/state (vm)
  - `.utils.ts` — magic numbers, config lists/objects, shared pure functions
  - `.model.ts` — interfaces and types
  - `.component.ts` — definition and UI logic only

### vm service

- [ ] Provided at component level (not `providedIn: 'root'` without reason), `protected`, named `vm`, used directly in the template
- [ ] Split into several services when godlike (usually 500+ lines; **consider**)

### Imports (conventions › Imports)

- [ ] No import from another app (needed code moves to a lib first)
- [ ] No relative import across libs — use the lib barrel
- [ ] Inside a lib, relative paths, not its own barrel (circular-dependency risk)
