```skill
---
name: bug-finder
description: >
  Deeply scans code for runtime bugs, logic errors, and correctness defects in the Nuclia
  frontend monorepo. Use this skill whenever code needs to be audited for actual bugs rather
  than style issues — including during code review, when a user reports unexpected behaviour,
  when writing or reviewing a PR, or when asked to "find bugs", "check for bugs", "is this
  correct?", or "what could go wrong here?". This skill is intentionally narrow: it reports
  only things that are broken or will likely break at runtime, not style, architecture, or
  best-practice nudges (those belong in code-review). Designed to be invoked by automated
  agents as well as interactively.
---

# Bug Finder — Nuclia Frontend Monorepo

Scan code for defects that cause or are likely to cause incorrect behaviour at runtime.
Do NOT flag style issues, naming conventions, or architectural preferences — only genuine bugs.

---

## How to obtain code to scan

1. If the user pastes a diff, file content, or code snippet directly, use that.
2. For a branch review: `git diff main...HEAD` — focus on `+` lines.
3. For a single file: read it directly, then scan the full function bodies of changed or suspect areas.
4. When a bug reference points elsewhere (e.g., a service used by the changed component), read that file too.

---

## Bug Catalogue

Work through the changed or provided code against every category below. Report only confirmed or
highly probable defects — not hypothetical ones.

---

### Memory Leaks — RxJS Subscriptions

A subscription that is never cleaned up will keep running after the component/service is destroyed,
causing stale state updates, duplicate side-effects, and memory pressure.

**Flag when:**
- `.subscribe()` is called inside a component or directive without any of:
  - `takeUntilDestroyed()` (modern Angular)
  - `take(1)` / `first()` (valid only for single-emission streams)
  - storing the result and calling `.unsubscribe()` in `ngOnDestroy`
  - the `async` pipe (which auto-unsubscribes)
- A `Subject` or `BehaviorSubject` is used as a `takeUntil` notifier instead of `takeUntilDestroyed()`.
- `shareReplay()` is called **without** `{ refCount: true }` on a stream that could stay alive after
  all subscribers unsubscribe (this keeps the HTTP connection and internal state alive).

---

### Race Conditions — Wrong Flattening Operator

Choosing the wrong higher-order mapping operator (switchMap / mergeMap / concatMap / exhaustMap)
can cause stale responses to overwrite fresh ones, or duplicate side-effects.

**Flag when:**
- `mergeMap` (or `flatMap`) is used to call an API that should cancel the previous request when a
  new one comes in (e.g., a search-as-you-type, a page navigation). Should be `switchMap`.
- `switchMap` is used for a write operation (POST, PUT, DELETE) where all calls must complete in
  order. Should be `concatMap`.
- `mergeMap` is used for a form-submit action where the user must not be able to trigger two
  simultaneous requests. Should be `exhaustMap`.

---

### Silent Error Swallowing

Errors that are swallowed without logging or user notification make bugs invisible in production.

**Flag when:**
- `catchError` returns `EMPTY` or `of([])` with no `console.error`, no toast, and no Sentry/logging call.
- A `try/catch` block has an empty `catch` body or only a comment.
- A Promise rejection is not handled (`.then(fn)` without `.catch(fn)` and without `await` in a
  try/catch).

---

### Angular Change Detection Bugs

OnPush components only re-render when their inputs change, a signal they read changes, or
`markForCheck()` / `detectChanges()` is called. Forgetting this causes stale UI.

**Flag when:**
- An OnPush component holds a mutable object reference and mutates it in-place
  (e.g., `this.items.push(x)` instead of `this.items = [...this.items, x]`). The template will
  not re-render because the reference did not change.
- A callback from a third-party library (e.g., a WebSocket message, a non-Angular event) modifies
  component state without running inside Angular's zone or calling `markForCheck()`.
- `ChangeDetectorRef.detectChanges()` is called inside `ngOnDestroy` or after the component is
  destroyed (throws a `ViewDestroyedError` at runtime).

---

### Null / Undefined Dereference

**Flag when:**
- A property is accessed on a value that the types say can be `null | undefined`, without a
  preceding null check or the optional-chaining operator (`?.`).
- A non-null assertion `!` is used on a value that is observably nullable at that point in the
  control flow (e.g., `this.currentUser!.id` where `currentUser` starts as `null`).
- `Array.prototype` methods such as `.map`, `.filter`, `.find` are called on a value that could
  be `undefined` at runtime (e.g., a signal or BehaviorSubject whose initial value is `undefined`).
- A `@ViewChild` / `@ContentChild` result is used outside `ngAfterViewInit` / `ngAfterContentInit`
  without a null guard (it is `undefined` before those lifecycle hooks).

---

### Signal Bugs (Angular Signals)

**Flag when:**
- A `computed()` call contains a side-effect (`computed(() => { this.service.fetch(); return x; })`).
  Computed signals must be pure; side-effects won't run reliably and can cause infinite loops.
- An `effect()` writes to a signal it also reads, creating a circular update cycle, unless
  `allowSignalWrites` is intentionally set and the cycle is bounded.
- `toSignal()` is called outside an injection context (e.g., inside `ngOnInit` or a method) without
  passing `{ injector }`. Throws a runtime error.
- A signal's value is compared with `===` against an object/array literal inline 
  (e.g., `if (mySignal() === [])`) — always false; likely a bug.

---

### Form Bugs (Angular Reactive Forms)

**Flag when:**
- `formGroup.value` is used where the full model is needed but some controls are `disabled` — 
  disabled controls are excluded from `.value`. Use `formGroup.getRawValue()` instead.
- A `FormControl` is initialised with `null` but its type annotation doesn't include `null`
  (strict mode will flag this; non-strict silently allows it, causing runtime type errors downstream).
- `form.reset()` is called without arguments on a form that has required validators — this sets all
  controls to `null`, which immediately makes the form invalid, which may cause unintended behaviour
  if the submit button state depends on `form.valid`.

---

### Router / Navigation Bugs

**Flag when:**
- `router.navigate(['../sibling'])` is called from a service (not a component) without providing
  a `relativeTo` `ActivatedRoute` — relative navigation from a service always fails silently.
- `router.navigateByUrl` is used with a relative URL (not starting with `/`) — this resolves
  against the current URL unexpectedly.
- A route guard returns `Observable<boolean>` from a stream that never completes — the navigation
  hangs indefinitely.

---

### Async / Promise Bugs

**Flag when:**
- `async` function result is not `await`ed and the error path is therefore unhandled.
- A `Promise.all([...])` call is missing `await`, so the promise is discarded.
- `setTimeout` / `setInterval` is used inside an Angular component without being cleared in
  `ngOnDestroy` (memory leak + stale callbacks).
- `lastValueFrom` / `firstValueFrom` is called on an Observable that never emits, causing the
  promise to hang or reject with an `EmptyError`.

---

### Type Coercion / Comparison Bugs

**Flag when:**
- `==` is used instead of `===` in a context where type coercion could cause false positives
  (e.g., `0 == ''` is `true`).
- A numeric template binding receives a string from `<input>` without `parseInt`/`parseFloat`
  (HTML inputs always return strings; arithmetic with them silently concatenates instead of adding).
- A `switch` statement on a union type is missing a case branch for one of the union members
  and has no `default` that throws.

---

## Output Format

Group findings by file. Within a file, list findings in the order they appear in the code.
Each finding is one line:

```
**[SEVERITY]** `path/to/file.ts` (line ~N) — what the bug is and why it breaks. Suggested fix.
```

Severity labels (choose one):
- **CRASH** — will throw at runtime or cause an irrecoverable error under normal usage
- **BUG** — incorrect behaviour that users will observe, but the app keeps running
- **LEAK** — resource/memory leak that degrades the app over time
- **RACE** — race condition that is intermittent and hard to reproduce

Only use these four labels. Do not use WARN, STYLE, or INFO — this skill is bugs-only.

Finish with: `N bugs found (X CRASH, Y BUG, Z LEAK, W RACE) across M files.`
If nothing is found, output: `No bugs found.`

---

## What NOT to flag

- Style issues, naming conventions, or architectural preferences.
- Pre-existing code in unchanged lines (stay in scope of the diff unless a bug only manifests
  because of the interaction between old and new code).
- Intentional patterns documented in a nearby comment or in the file's AGENTS.md.
- TypeScript type errors that the compiler already catches — only flag runtime gaps the
  compiler misses (e.g., `any` casting that hides a null).
- Hypothetical bugs that require highly unlikely input combinations without evidence in the code
  that such inputs are possible.
```
