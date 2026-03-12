---
name: rxjs-patterns
description: >
  RxJS patterns as used in the Nuclia frontend monorepo — covering Subject type selection,
  flattening operator decisions (switchMap vs concatMap vs mergeMap), combination operators
  (combineLatest vs forkJoin vs withLatestFrom), error handling, shareReplay placement,
  cleanup strategies, debounce conventions, Angular signal interop, and import hygiene.
  Activate this skill for ANY task that touches observable pipelines, service state streams,
  RxJS subscriptions, or operator choices in Angular apps or libs. Do not wait to be asked
  about "RxJS patterns" specifically — if the task writes or modifies a .pipe(), creates a
  Subject, adds a subscription in a service or component, uses catchError/switchMap/forkJoin,
  or asks "which operator should I use here?", this skill applies. Also use when debugging
  streams that never emit, emit multiple times unexpectedly, or cause memory leaks. This skill
  covers Angular libs and apps only; it does not cover search-widget (Svelte) or rao-widget (React).
---

# RxJS Patterns — Nuclia Frontend Monorepo

This skill encodes patterns as they are **actually used** in this codebase. RxJS has hundreds of
operators; this covers only what the team has adopted and the decisions that actually come up.
When in doubt, match existing code.

---

## Non-Negotiable Rules

1. **Import from `'rxjs'`, not `'rxjs/operators'`** — the deep import path is legacy. New code always imports from the root package. When modifying a legacy file that uses `'rxjs/operators'`, you may leave those imports in place rather than rewriting unrelated lines.
2. **Always `catchError` on service-level HTTP pipelines** — an uncaught error completes the observable permanently. After completion, `BehaviorSubject` triggers, `shareReplay`, and `async` pipes all stop working silently.
3. **Always `shareReplay(1)` at the end of service pipelines** — without it every new subscriber (template `async` pipe, `toSignal()`, manual subscription) triggers a separate HTTP request.
4. **`takeUntilDestroyed()` in new components, never the Subject cleanup pattern** — the old `takeUntil(this.unsubscribeAll)` pattern is acceptable to *maintain* in existing files but must not be created in new ones.
5. **Use `BehaviorSubject(undefined)` as a Tier 2 refresh trigger, never bare `Subject`** — `Subject` emits nothing on subscription, so data never loads until the first manual `refresh()` call.
6. **Never call `toSignal()` inside a service** — it creates a hidden subscription that bypasses `shareReplay` caching.

---

## Subject Type Selection

Pick the right Subject the first time — changing it later breaks subscribers that rely on the replay behaviour.

| Need | Use | Why |
|---|---|---|
| Mutable state that components read synchronously | `BehaviorSubject<T>(initialValue)` | Holds current value; `.getValue()` works; emits immediately to new subscribers |
| "Current X" slot that gets set exactly once (or replaced) | `ReplaySubject<T>(1)` | Late subscribers get the last emission without an artificial initial `null`; used for `currentKb`, `currentArag`, `kbList` in `SDKService` |
| A fire-and-forget event bus (no current value needed) | `Subject<T>()` | Appropriate for one-way notifications that don't need a current-value replay — **not** for state triggers |
| Refresh trigger for a Tier 2 data pipeline | `BehaviorSubject<void>(undefined)` | The `undefined` initial value kicks off the first load automatically |
| Buffered multi-value replay | `ReplaySubject<T>(N)` | Rare; only when N > 1 makes sense (e.g. history queues) |

### When `ReplaySubject(1)` beats `BehaviorSubject`

`BehaviorSubject` requires an initial value at construction time. When the real value arrives asynchronously (e.g. after an HTTP call sets the current KB), you'd be forced to use `null` as the initial value and then `filter(v => !!v)` everywhere downstream. `ReplaySubject(1)` sidesteps this — it emits nothing until the first real value arrives, so downstream operators never see `null`.

```ts
// ✅ SDKService pattern — no null sentinel needed
private _currentKB = new ReplaySubject<WritableKnowledgeBox>(1);
currentKb = this._currentKB.asObservable();   // late subscribers get the last KB

// ❌ Would force null-filtering everywhere
private _currentKB = new BehaviorSubject<WritableKnowledgeBox | null>(null);
currentKb = this._currentKB.pipe(filter(kb => !!kb), map(kb => kb!));
```

---

## Flattening Operator Decision

All four operators flatten `Observable<Observable<T>>` into `Observable<T>`, but they differ in what happens when a new inner observable arrives before the previous one completes.

| Operator | New inner arrives while previous is active | Use when |
|---|---|---|
| `switchMap` | Cancels previous, subscribes to new | Active KB changes, search queries, navigation triggered by route params — any time "only the latest matters" |
| `concatMap` | Queues; waits for previous to complete | Sequential steps that must preserve order: create label → upload resource → refresh list |
| `mergeMap` | Subscribes to both concurrently | Parallel independent requests with no ordering requirement: batch deletes, md5 computation over files |
| `exhaustMap` | Ignores new until previous completes | Not currently used in this codebase; would apply to submit-button debouncing |

> **Default to `switchMap`.** It is the right choice for the majority of cases in this codebase (loading data when a context changes). Reach for `concatMap` only when sequence matters; `mergeMap` only when true parallelism is needed.

```ts
// switchMap — loading data when context changes (most common)
entities$ = this.sdk.currentKb.pipe(
  switchMap((kb) => kb.getEntities()),
  catchError(() => EMPTY),
);

// concatMap — sequential mutation steps (upload.service.ts)
this.createMissingLabels(labels).pipe(
  concatMap(() => this.uploadFiles(files, onProgress)),
).subscribe();

// mergeMap — parallel independent work (sdk-core upload.ts)
from(files).pipe(
  mergeMap((file) => this.uploadSingle(file)),
  toArray(),
)
```

---

## Combination Operators

| Operator | Emission behaviour | Use when |
|---|---|---|
| `combineLatest([a$, b$])` | Emits whenever *any* source emits; waits until all have emitted at least once | Deriving state from two or more continuously-changing streams (account + features, kb + account URL) |
| `forkJoin([a$, b$])` | Emits once when *all* sources complete | One-shot parallel data loading; **requires** `take(1)` on infinite streams (BehaviorSubject, ReplaySubject) |
| `merge(a$, b$)` | Emits every value from every source as it arrives | Treating multiple sources as one stream (kb role or arag role = either triggers the same check) |
| `withLatestFrom(b$)` | Primary stream drives; `b$` provides latest snapshot | One stream triggers, the other provides context without becoming a trigger itself |
| `zip([a$, b$])` | Emits only when all sources have emitted the Nth value in sync | Rare; position-matched pairing of two streams |

```ts
// combineLatest — URL depends on both account and kb; updates when either changes
homeUrl = combineLatest([this.sdk.currentAccount, this.sdk.currentKb, this.sdk.arag]).pipe(
  map(([account, kb, arag]) => buildUrl(account, kb, arag)),
);

// forkJoin — load account and kb once before performing an action
return forkJoin([
  this.currentAccount.pipe(take(1)),
  this.currentKb.pipe(take(1)),
]).pipe(
  switchMap(([account, kb]) => doSomething(account, kb)),
);

// withLatestFrom — save triggered by button click; kb is context only
saveClick$.pipe(
  withLatestFrom(this.sdk.currentKb),
  switchMap(([_, kb]) => kb.save(payload)),
);
```

> **`forkJoin` gotcha:** If any source never completes, `forkJoin` never emits. Always add `take(1)` to `BehaviorSubject`, `ReplaySubject`, or `combineLatest`-derived streams passed to `forkJoin`.

---

## Error Handling

An unhandled error in a `.pipe()` *completes* the observable — it will never emit again. This is the most common cause of "the data stopped loading after one error" bugs.

### Standard patterns

```ts
// Standard fallback — emit an empty/default value and continue
catchError(() => of([]))       // empty array fallback
catchError(() => of(null))     // null fallback when null is meaningful
catchError(() => EMPTY)        // emit nothing; let the stream complete quietly

// Fallback + side effect (toast notification)
catchError((error) => {
  this.toast.error('upload.error');
  return of(null);
})

// Error with rethrow after logging (rare — usually in HTTP interceptors)
catchError((err) => {
  console.error(err);
  return throwError(() => err);
})
```

### Placement rule

`catchError` must appear **inside** a `switchMap` / `concatMap` / `mergeMap` inner pipeline when the outer subscription must survive errors from individual items. Placing it outside lets a single failure kill the whole outer stream.

```ts
// ✅ Inner catchError — one failed item does not kill the stream
this.sdk.currentKb.pipe(
  switchMap((kb) =>
    kb.getEntities().pipe(
      catchError(() => EMPTY),   // ← inside the switchMap callback
    ),
  ),
)

// ❌ Outer catchError — one failed load permanently stops responding to KB changes
this.sdk.currentKb.pipe(
  switchMap((kb) => kb.getEntities()),
  catchError(() => EMPTY),   // ← too late; kills the outer stream
)
```

---

## `shareReplay(1)` — Multicasting

`shareReplay(1)` does two things:
1. **Multicasts** — all subscribers share one HTTP request instead of each triggering their own.
2. **Replays** — new late subscribers (including components added to the DOM after the first load) immediately receive the last emitted value.

Always use buffer size **1**. Use larger buffers only if you explicitly need history.

```ts
// ✅ Standard service pipeline — shareReplay at the end
drivers$ = this._refreshTrigger.pipe(
  switchMap(() => this.sdk.currentArag),
  switchMap((arag) => arag.getDrivers()),
  catchError(() => of([])),
  tap((drivers) => this._drivers.set(drivers)),
  shareReplay(1),           // ← always last (after tap)
);

// ✅ Also shared mid-chain when intermediate result is reused
private accountMd5 = this.sdk.hasAccount.pipe(
  switchMap((has) => has ? this.sdk.currentAccount.pipe(
    map((a) => SparkMD5.hash(a.id)),
    shareReplay(1),         // ← prevents recomputing the md5 for each combineLatest consumer
  ) : of('')),
);
```

---

## Cleanup Strategies

### New components — `takeUntilDestroyed()`

```ts
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export class MyComponent {
  constructor() {
    this.service.events$
      .pipe(takeUntilDestroyed())   // must be in injection context
      .subscribe((e) => this.handle(e));
  }
}
```

`takeUntilDestroyed()` must be called in an **injection context** — either in the constructor body or at property initializer level. It cannot be called inside `ngOnInit` or a method.

### Legacy components — Subject pattern (maintain only)

```ts
private unsubscribeAll = new Subject<void>();

ngOnDestroy() {
  this.unsubscribeAll.next();
  this.unsubscribeAll.complete();
}

// inside subscriptions:
.pipe(takeUntil(this.unsubscribeAll))
```

Do not create this pattern in new code. In existing files, leave it in place — mixing both styles in one file is acceptable.

---

## Debounce Conventions

| Context | Operator | Duration |
|---|---|---|
| Search / autocomplete inputs | `debounceTime(300)` | 300 ms |
| Form field value changes (validation) | `debounceTime(200)` or `debounceTime(10)` | 200 ms general; 10 ms when waiting for a reactive form to stabilise after programmatic updates |
| Notification batching (after server push) | `debounceTime(2000)` | 2 s to collapse bursts |
| DOM resize / scroll events | `auditTime(100)` | 100 ms (use `auditTime` not `debounceTime` for continuous events — `auditTime` always fires, `debounceTime` can be starved by rapid firing) |

---

## `take(1)` — Snapshots from Infinite Streams

Use `take(1)` whenever you need a one-time read of a long-lived stream and don't want to stay subscribed:

```ts
// ✅ Read current KB once before performing a write
this.sdk.currentKb.pipe(
  take(1),
  switchMap((kb) => kb.modify(payload)),
).subscribe(...)

// ✅ Snapshot inside forkJoin
forkJoin([
  this.sdk.currentAccount.pipe(take(1)),
  this.sdk.currentKb.pipe(take(1)),
])
```

`first()` is a stricter variant of `take(1)` — it errors if the source completes before emitting. Prefer `take(1)` unless you specifically want that error.

---

## Observable Naming Conventions

| Location | Convention | Example |
|---|---|---|
| Service-internal pipeline properties | `foo$` suffix | `drivers$`, `refreshNeeded$` |
| Public service interface properties (SDKService style) | no `$`, just a noun | `currentKb`, `kbList`, `refreshingKbList` |
| Observable params or locals in methods | `$` suffix or descriptive name | `click$`, `valueChanges$` |

There is a split in this codebase: older services (core, user) use SDKService's no-suffix style; newer services (common) often use `$`. Match the style of the file you're editing.

---

## Angular Signal Interop

```ts
// ✅ Observable → Signal in components (with initialValue to avoid undefined)
items = toSignal(this.service.items$, { initialValue: [] as Item[] });

// ✅ When stream is guaranteed to emit synchronously
count = toSignal(this.service.count$, { requireSync: true });

// ✅ Service exposes readonly signal (Tier 2 pattern)
//    The pipeline taps to update the signal; components read the signal
drivers$ = this._trigger.pipe(
  switchMap(() => this.api.getDrivers()),
  catchError(() => of([])),
  tap((d) => this._drivers.set(d)),
  shareReplay(1),
);
drivers = this._drivers.asReadonly();

// ❌ Do NOT call toSignal() inside a service
// This creates a hidden subscription that bypasses shareReplay
drivers = toSignal(this.drivers$);   // bad — every consumer causes duplicate subscription
```

---

## Import Hygiene

```ts
// ✅ New code — always import from 'rxjs'
import { BehaviorSubject, catchError, combineLatest, filter, from,
         map, of, ReplaySubject, shareReplay, Subject, switchMap,
         takeUntil, tap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// ❌ Legacy-only deep path — do not create in new files
import { catchError, map } from 'rxjs/operators';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
```

---

## Common Mistakes

| Mistake | Correct approach |
|---|---|
| `new Subject<void>()` as Tier 2 refresh trigger | `new BehaviorSubject<void>(undefined)` — no initial emit means data never loads automatically |
| `catchError` outside a flattening operator | Move inside `switchMap`/`concatMap` callback to keep outer stream alive |
| Missing `catchError` on HTTP-backed pipelines | Always include — uncaught error permanently kills the stream |
| Missing `shareReplay(1)` on service pipelines | Always include — without it each subscriber issues a separate HTTP request |
| `toSignal(obs$)` inside a service | Use `tap((v) => this._sig.set(v))` in pipeline instead |
| `take(1)` before `switchMap` when you actually want the latest | Only `take(1)` when you want a snapshot; use the stream continuously for reactive loading |
| `forkJoin` on hot infinite streams without `take(1)` | `forkJoin` never emits if any source never completes |
| `concatMap` for concurrent independent HTTP requests | Use `mergeMap` — `concatMap` serialises and slows things down |
| `mergeMap` for "only latest matters" search | Use `switchMap` — `mergeMap` can return stale results out of order |
| Importing from `'rxjs/operators'` in new files | Import from `'rxjs'` |
| `takeUntilDestroyed()` called in `ngOnInit` | Must be in injection context: constructor body or property initializer |
| Subject cleanup pattern in new components | Use `takeUntilDestroyed()` |
| Forgetting `asReadonly()` on public signal exposure | `asReadonly()` prevents external `.set()` calls; don't export raw `signal()` |

---

## Reference Files

Load these when you need full annotated examples — don't load proactively, only on demand:

| File | When to load |
|------|-------------|
| `references/codebase-examples.md` | Want complete, annotated examples lifted from real files in this repo — covers SDKService Subject mix, feature-flag combineLatest chains, upload concatMap/mergeMap, ner service EMPTY error handling |
