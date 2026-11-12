# Pass 1 — Conventions & patterns

**Question:** Does the changed code follow our documented patterns?

Structure and file placement are pass 2. Bugs are pass 4.

## Load

`conventions`. Open `angular-developer` / `spartan` files only when an item needs them.

## Checklist

### State and reactivity (conventions › State management; angular-developer `signals-overview`, `linked-signal`, `resource`, `effects`)

- [ ] Changeable state is a `signal`; derived values are `computed` / `linkedSignal`; `effect` only for side effects (logging, DOM/third-party sync)
- [ ] Observables only for complex async flows — not `BehaviorSubject`/`Subject` for simple state
- [ ] Async data loaded via `resource` / `httpResource` / `HttpClient` (angular-developer `http-client`), not ad-hoc `subscribe` into fields

### Angular style (conventions › Components; angular-developer `components`, `inputs`, `outputs`, `di-fundamentals`)

- [ ] Standalone components; NgModule only when components must be exported and used together
- [ ] `input()` / `output()` / `model()` / `viewChild()` / `inject()` — no decorators or constructor injection
- [ ] `@if` / `@for` (with `track`) / `@switch` — no `*ngIf` / `*ngFor`

### Naming and types (conventions › Naming, TypeScript)

- [ ] No `any`
- [ ] `interface` for object shapes; `type` only for union literals
- [ ] No `enum` — union literals; constants in `UPPER_SNAKE`
- [ ] No interface prefixes; `Summary`/`Details` suffix only for extendable shapes
- [ ] Component selector prefix matches origin: `app-` (application), `lib-` (library), `ui-` (our design system on Spartan); `hlm-` is reserved for original Spartan components — no per-app/per-lib prefixes

### Styling (conventions › Files of a component)

- [ ] Tailwind classes in the template; a style file only when really needed, and then `.css`, never `.scss`

### spartan UI (spartan `SKILL.md` principles; `rules/*.md` per area touched)

- [ ] Existing Helm/Brain components used instead of custom markup; selectors confirmed, not guessed
- [ ] Built-in `variant` / `size` inputs before custom classes; semantic color tokens, no raw colors (`rules/styling.md`)
- [ ] Forms use `hlmField` composition (`rules/forms.md`); dialogs/sheets have a title, items sit in their groups (`rules/composition.md`)
- [ ] `<ng-icon>` icons registered with `provideIcons` (`rules/icons.md`)
- [ ] Brain used directly only when Helm cannot do the job (`rules/brain-vs-helm.md`)
- [ ] Icon-only buttons have an accessible label

### Translations (conventions › Translations)

- [ ] The diff changes only `en.json` among translation files; flag any added, edited or deleted text in other locale files (`ca`, `es`, `fr`, ...) — **must**
- [ ] New user-visible text is a translation key, not a hardcoded string

### Comments (conventions › Comments)

- [ ] No comments that narrate the code, restate names/types, or repeat a signature (including JSDoc and `// TODO`-style filler); flag every one added by the diff
- [ ] Remaining comments explain a kludge or hack only, and are short (one line)
- [ ] Commented-out code is removed

### Conflicts

When `angular-developer` suggests a different file/class naming style, `conventions` wins — do not report it.
