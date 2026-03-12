---
name: performance
description: >
  Performance patterns for the Nuclia frontend monorepo — covering OnPush change detection with
  signals, computed() memoisation, track in @for loops, lazy routing, shareReplay(1) placement,
  debounce/auditTime conventions, CDK virtual scroll, bundle budgets, and the known shareReplay()
  anti-pattern. Activate this skill when reviewing a component for performance, adding @for loops,
  choosing between signal() and computed(), setting up lazy routes, writing service-level streams,
  or when the user asks about bundle size, change detection, or rendering performance. Also use
  when a code review finds markForCheck(), shareReplay() without a buffer argument, $index in
  track expressions, or eager route loading — these are all actionable problems this skill covers.
---

# Performance Patterns — Nuclia Frontend Monorepo

Performance work in this codebase almost always comes down to these five areas: change detection
discipline, signal memoisation, list rendering, lazy loading, and stream sharing. The patterns
below encode what the team has adopted — follow them rather than inventing new approaches.

---

## Non-Negotiable Rules

1. **`ChangeDetectionStrategy.OnPush` on every component** — enforced by `nx.json` generator
   defaults. This is already correct in all new generated components; don't remove it.
2. **No `markForCheck()` in new code.** The need for `markForCheck()` is a signal that the
   component should be using `toSignal()` or the `async` pipe instead of manual subscriptions.
3. **Every `@for` must have a meaningful `track` expression.** `track $index` is acceptable only
   for truly static lists (e.g., enum values). For any data fetched from the API, track by `id`,
   `slug`, or another stable identifier.
4. **`shareReplay(1)` only — never `shareReplay()` without an argument.** The zero-argument form
   keeps an indefinite buffer and does not complete on refCount reaching 0. This is an active
   memory leak. See the RxJS patterns skill for details.
5. **All new feature routes must be lazy-loaded.** `loadComponent` for standalone components,
   `loadChildren` for module-based routes.

---

## OnPush and Signals

### Why `markForCheck()` appears in legacy code

Legacy components subscribed manually and needed to tell Angular to re-check the view:

```ts
// Legacy — avoid in new code
constructor(private cdr: ChangeDetectorRef) {}

ngOnInit() {
  this.service.items$.subscribe(items => {
    this.items = items;
    this.cdr.markForCheck();   // ← must be called manually
  });
}
```

### Modern replacement — signals + toSignal()

Signals are natively compatible with OnPush. No `markForCheck()` needed:

```ts
// Modern
items = toSignal(this.service.items$, { initialValue: [] });

// Template reads .items() automatically; OnPush sees the signal change
```

`toSignal()` must be called in an injection context (property initializer or inside
`constructor()`). It calls `takeUntilDestroyed()` internally — no manual cleanup needed.

---

## computed() — Signal Memoisation

Use `computed()` for any value that is derived from other signals. Angular memoises the result
and only recomputes when dependencies change.

```ts
// Good — computed only recalculates when pagination signal changes
readonly page         = computed(() => this.pagination().page);
readonly totalPages   = computed(() => Math.ceil(this.pagination().total / this.pagination().size));
readonly isEmpty      = computed(() => this.items().length === 0);

// Bad — recomputes every change detection cycle
get totalPages() {
  return Math.ceil(this.pagination().total / this.pagination().size);
}
```

**Rule of thumb:**
- `signal()` → mutable local state: loading flags, form toggles, selected item ID
- `computed()` → everything derived: filtered lists, display strings, boolean flags from other signals
- `toSignal()` → bridge from Observable to signal

Avoid `computed()` on async operations — use `toSignal()` for those.

---

## track in @for Loops

Angular 17+ block syntax requires a `track` expression. Always use a stable unique property:

```html
<!-- Good — stable business key -->
@for (member of members(); track member.id) { ... }
@for (zone of zones(); track zone.slug) { ... }
@for (locale of locales; track locale.code) { ... }

<!-- Acceptable — truly static list (not from API) -->
@for (tab of ['overview', 'settings', 'logs']; track $index) { ... }

<!-- Bad — mutable list from API -->
@for (item of items(); track $index) { ... }   ← loses DOM nodes on re-order
```

**Legacy `trackBy` on `*ngFor`:** If you're maintaining an old NgFor, keep `trackBy` in place.
When migrating to `@for`, convert `trackBy fn` → `track item.id` inline.

---

## Lazy Route Loading

Every feature area in `dashboard`, `rao`, and `manager-v2` is lazy-loaded.
All new feature routes must follow the same pattern:

```ts
// Standalone component (modern — preferred)
{
  path: 'my-feature',
  loadComponent: () =>
    import('./my-feature/my-feature.component').then(m => m.MyFeatureComponent),
}

// Module-based (legacy only — do not create new NgModules)
{
  path: 'my-feature',
  loadChildren: () =>
    import('./my-feature/my-feature.module').then(m => m.MyFeatureModule),
}
```

Eager loading (`component: MyFeatureComponent` directly in the routes array) is only acceptable
for root-level shell components (the app layout shell, the not-found page).

---

## shareReplay(1) — Correct Placement in Service Pipelines

```ts
// Correct — catchError BEFORE shareReplay
readonly items$ = this.http.get<Item[]>('/api/items').pipe(
  map(res => res.items),
  catchError(() => of([])),
  shareReplay(1),            // ← last operator
);

// Wrong — shareReplay before catchError replays errors to future subscribers
readonly items$ = this.http.get<Item[]>('/api/items').pipe(
  shareReplay(1),            // ← too early
  map(res => res.items),
  catchError(() => of([])),
);

// Wrong — no buffer argument (memory leak)
shareReplay()               // ← use shareReplay(1)
```

Known instances of `shareReplay()` without buffer in the codebase:
- `apps/manager-v2/src/app/manage-accounts/account.service.ts`
- `libs/common/src/lib/account/billing/history/history.component.ts`

When touching these files, fix the anti-pattern.

---

## Debounce and auditTime Conventions

| Scenario | Operator | Duration |
|----------|----------|----------|
| User types in search / filter input | `debounceTime` | 300 ms |
| Form value changes triggering API | `debounceTime` | 300 ms |
| Window resize → chart/SVG redraw | `auditTime` | 200 ms |
| Window resize → layout calculation | `auditTime` | 100 ms |

```ts
// Search input
this.searchControl.valueChanges.pipe(
  debounceTime(300),
  distinctUntilChanged(),
  switchMap(term => this.service.search(term)),
)

// Resize
fromEvent(window, 'resize').pipe(
  auditTime(200),
  takeUntilDestroyed(),
).subscribe(() => this.redrawChart());
```

`auditTime` is preferred over `debounceTime` for resize because it emits the **last** value
within the window at the end of the window, not when the stream goes quiet.

---

## CDK Virtual Scroll — Long Lists

Use `cdk-virtual-scroll-viewport` for lists expected to hold more than ~100 items.
The activity log in `dashboard` is the established reference:

```html
<cdk-virtual-scroll-viewport itemSize="48" class="viewport">
  <div *cdkVirtualFor="let row of rows; trackBy: trackById" class="row">
    <!-- row content -->
  </div>
</cdk-virtual-scroll-viewport>
```

```ts
import { ScrollingModule } from '@angular/cdk/scrolling';

@Component({
  imports: [ScrollingModule, ...],
})
```

For lists that grow incrementally (not paginated), the slice-based pattern in `manager-v2`
is acceptable: start with 100 items (`slice: 0 : lastIndex`) and increment by 100 on scroll
anchor (`onReachAnchor()`).

---

## Bundle Budgets — Know the Limits

Current build budget configuration:

| App | Warn at | Error at | Notes |
|-----|---------|----------|-------|
| `dashboard` | 2 MB | **30 MB** | Error limit is very lax — do not raise it further |
| `manager-v2` | 500 KB | 2 MB | Tighter, more accurate |
| `sistema-demo` | 500 KB | 3 MB | Demo app, reasonable |

When reviewing a PR that increases bundle size significantly, flag it. The dashboard's 30 MB
error budget hides real regressions. To check actual bundle size:

```bash
nx build dashboard --stats-json
# Then analyse dist/apps/dashboard/stats.json with a visualiser
```

No bundle analyser is currently wired into `project.json` targets. If comparing large PRs,
run `source-map-explorer` or `webpack-bundle-analyzer` locally on the stats file.

---

## PR Review Performance Checklist

Use this when reviewing any component or service:

- [ ] `ChangeDetectionStrategy.OnPush` present
- [ ] No `markForCheck()` in new code
- [ ] All `@for` loops have meaningful `track` (not `$index` for API data)
- [ ] All service-level streams use `shareReplay(1)` (with buffer argument)
- [ ] `catchError` is before `shareReplay(1)` in the pipeline
- [ ] New routes use `loadComponent` or `loadChildren` (lazy)
- [ ] User-input streams have `debounceTime(300)`
- [ ] Resize/layout streams have `auditTime(200)` or `auditTime(100)`
- [ ] Lists > 100 items consider `cdk-virtual-scroll-viewport`
- [ ] Derived values use `computed()` rather than getters

---

## search-widget (Svelte 5) and rao-widget (React 19)

Performance in the widgets differs from the Angular apps:

**search-widget (Svelte 5):**
- Svelte's compile-time reactivity eliminates change detection overhead entirely.
- Infinite scroll uses a scroll/resize listener in `InfiniteScroll.svelte` — a future
  improvement would replace this with `IntersectionObserver`.
- Heavy search results are filtered and sorted in RxJS streams inside `api.ts` before
  entering the store — keep expensive transforms in the RxJS layer, not in Svelte `$derived`.

**rao-widget (React 19):**
- Use `useMemo` for expensive derived values in components.
- `useCallback` for event handlers passed to child components.
- The WebSocket connection in `chat.ts` is held at the provider level — do not reconnect
  on every render; gate reconnects on URL/token changes only.
