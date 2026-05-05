---
name: angular-patterns
description: >
  Angular 21 patterns as used in the Nuclia frontend monorepo — covering OnPush change detection,
  inject() dependency injection, standalone components, signal-based state, RxJS↔Signal bridges,
  functional guards, and lazy routing. Activate this skill for ANY Angular task in this repo:
  creating or modifying components, writing services, managing state, adding routes or guards,
  refactoring legacy code to modern patterns, debugging change detection issues, or deciding which
  state management tier to use. Do not wait to be asked about "Angular patterns" specifically —
  if the task involves TypeScript files in apps/ or Angular libs/, this skill applies. Also use
  when migrating from @Input/@Output decorators, constructor injection, or NgModules to the modern
  Angular 21 style.
---

# Angular Patterns — Nuclia Frontend Monorepo

This skill encodes patterns as they are **actually used** in this codebase. Angular 21 has
many features; this covers only what the team has adopted. When in doubt, match existing code.

---

## Non-Negotiable Rules

1. **`ChangeDetectionStrategy.OnPush` on every component** — enforced by `nx.json` generator defaults. Never omit it.
2. **`inject()` instead of constructor injection** — all new services and components use `inject()` as property initializers. Constructor injection is legacy only.
3. **Standalone components by default** — only add `standalone: false` when a component must live inside an existing NgModule for backward compatibility. New code is always standalone.
4. **Do NOT write `standalone: true`** — in Angular 19+ standalone defaults to `true`. Writing it explicitly is redundant noise. Omit it.
5. **`@Input()`/`@Output()` decorators are legacy** — use `input()` / `output()` signal APIs for new components.
6. **`styleUrl` (singular string), not `styleUrls` (array)** — since Angular 17 the shorthand `styleUrl: './foo.component.scss'` replaces `styleUrls: ['./foo.component.scss']`. Always use the singular form in new code.
7. **No NgRx `signalStore`** — this codebase does not use `@ngrx/signals`. See state management section below.

---

## Code-Splitting Pattern: Component / Service / Config Trinity

Every non-trivial page or feature component **must** be split into three files:

| File                        | Responsibility                                                 | Class/export type                                                                                                   |
| --------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `feature-name.component.ts` | Template wiring, host element, signals bound to service state  | `@Component` class — no business logic, no HTTP calls, no inline data                                               |
| `feature-name.service.ts`   | All business logic, API calls, derived state                   | `@Injectable()` class — scoped to the component via `providers: [FeatureNameService]` in the `@Component` decorator |
| `feature-name.config.ts`    | Static configuration: column defs, dropdown options, constants | Exported `const` values and types — no class, no DI                                                                 |

### Rules

- **Component file** may only: inject the local service, bind signals to the template, handle user events by delegating to the service.
- **Service file** owns state as `signal()` / `computed()`. If state feeds from an observable, use the Tier 2 pattern (tap into signal, expose `asReadonly()`).
- **Config file** is pure TypeScript — no imports from Angular, no `@Injectable`. Import it in both the component and the service if needed.

### Example

```ts
// my-page.config.ts  — pure constants, no Angular imports
import { MyColumnDef } from './my-page.models';

export const MY_PAGE_COLUMNS: MyColumnDef[] = [
  { key: 'date', label: 'activity.column.date', width: '120px' },
  { key: 'name', label: 'activity.column.name', width: '1fr' },
];
```

```ts
// my-page.service.ts  — logic + state, local scope
import { Injectable, signal, computed, inject } from '@angular/core';
import { SDKService } from '@flaps/core';
import { MY_PAGE_COLUMNS } from './my-page.config';

@Injectable()
export class MyPageService {
  private sdk = inject(SDKService);

  // ── State (signals) ───────────────────────────────────────────────
  private _items = signal<MyItem[]>([]);
  private _loading = signal(false);

  items = this._items.asReadonly();
  loading = this._loading.asReadonly();
  isEmpty = computed(() => this._items().length === 0);

  loadData(month: string): void {
    this._loading.set(true);
    this.sdk.currentKb
      .pipe(
        switchMap((kb) => kb.getActivityLog(month)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (rows) => {
          this._items.set(rows);
          this._loading.set(false);
        },
        error: () => this._loading.set(false),
      });
  }
}
```

```ts
// my-page.component.ts  — thin wrapper, template wiring only
@Component({
  selector: 'app-my-page',
  templateUrl: './my-page.component.html',
  styleUrl: './my-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [MyPageService], // ← scopes service to this component tree
})
export class MyPageComponent {
  protected service = inject(MyPageService);
  readonly columns = MY_PAGE_COLUMNS; // ← from config, not computed here
}
```

> **When to provide locally vs in a module:** If the service holds state that should reset
> when the component is destroyed (e.g. per-page filter state), use component-level `providers`.
> If the state should survive route transitions, lift to the module providers.

---

## Component File Organization

Each feature module organises its files using a named-subfolder convention.

### Named subfolder rule

Every **page component** and all files that belong exclusively to it (`.component.ts`,
`.component.html`, `.config.ts`, `.service.ts`) **must** live in a subfolder named after the
component:

```
activity/
  activity-log-page.component.*    ← module-root component (exception — see below)
  activity-log-page.service.ts     ← belongs to the root component, stays at root
  activity.module.ts
  activity.service.ts              ← module-level shared service
  activity-column.model.ts         ← module-level model
  cost-token-page/                 ← subfolder: named after the page component
    cost-token-page.component.html
    cost-token-page.component.ts
    cost-token-page.config.ts
    cost-token-page.service.ts
  search-activity-page/            ← subfolder: named after the page component
    search-activity-page.component.html
    search-activity-page.component.ts
    ...
```

### Module-root exception

A component **stays at the module root** (not in a subfolder) when it is:

- The "spine" or wrapper/template component that other components in the module are routed into, **or**
- A component that is directly used (`<stf-foo>`) by other components in the same module.

Files that always stay at the module root: `*.module.ts`, shared `*.service.ts`, shared `*.model.ts`,
and the module-root component's own files.

### No empty SCSS files

Never create or commit empty `.scss` files. If a component needs no custom styles, **omit
`styleUrl` from the `@Component` decorator entirely** rather than pointing it at an empty file:

```ts
// ✅ No styles needed — omit styleUrl completely
@Component({
  selector: 'stf-my-page',
  templateUrl: './my-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})

// ❌ Never do this
@Component({
  styleUrl: './my-page.component.scss',  // file is empty — remove it
})
```

### Relative imports inside subfolders

When a component lives in a subfolder (`feature-name/feature-name.component.ts`), imports
to sibling module-level files use the `../` prefix:

```ts
// Inside cost-token-page/cost-token-page.component.ts
import { ActivityColumnModel } from '../activity-column.model';
import { ActivityLogPageComponent } from '../activity-log-page.component';
import { COST_TOKEN_COLUMNS } from './cost-token-page.config'; // sibling in same subfolder
```

---

## Component Skeleton

```ts
import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { TranslateModule } from '@ngx-translate/core';
import { PaButtonModule } from '@guillotinaweb/pastanaga-angular';
import { SomeService } from './some.service';

@Component({
  selector: 'stf-my-feature', // prefix from project.json
  imports: [TranslateModule, PaButtonModule],
  templateUrl: './my-feature.component.html',
  styleUrl: './my-feature.component.scss', // singular string, NOT styleUrls: [...]
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyFeatureComponent {
  // ── Services ────────────────────────────────────────────────────
  private someService = inject(SomeService);

  // ── Inputs (signal-based) ────────────────────────────────────────
  itemId = input.required<string>();
  label = input('', { transform: (v: string) => v.trim() });

  // ── Outputs ──────────────────────────────────────────────────────
  deleted = output<string>(); // emit the id, never 'onDeleted'

  // ── Local state ──────────────────────────────────────────────────
  private loading = signal(false);

  // ── Derived state ────────────────────────────────────────────────
  isReady = computed(() => !!this.itemId() && !this.loading());

  // ── Bridge from RxJS observable ──────────────────────────────────
  items = toSignal(this.someService.items$, { initialValue: [] });

  // ── Cleanup (new style) ──────────────────────────────────────────
  constructor() {
    this.someService.events$.pipe(takeUntilDestroyed()).subscribe((event) => this.handleEvent(event));
  }

  delete(): void {
    this.loading.set(true);
    this.someService.delete(this.itemId()).subscribe({
      next: () => this.deleted.emit(this.itemId()),
      error: () => this.loading.set(false),
    });
  }

  private handleEvent(event: unknown): void {
    /* ... */
  }
}
```

**Key points:**

- `inject()` at property level, not in constructor parameter list
- `input.required<T>()` enforces non-optional at compile time
- Output names are **verbs in past tense** (`deleted`, `saved`), never prefixed with `on`
- `takeUntilDestroyed()` requires being called in injection context (constructor or initializer)
- Legacy cleanup (`Subject + takeUntil + ngOnDestroy`) is still acceptable to maintain in existing files

---

## State Management: Three Tiers

The codebase uses three distinct patterns. Match the one that fits the scope:

### Tier 1 — Module-level signals (lightweight global UI state)

Use when state belongs to a feature area but doesn't need a service lifecycle.
See `libs/common/src/lib/retrieval-agent/agent-dashboard/workflow/workflow.state.ts`.

```ts
// workflow.state.ts — module-level, NOT a class
import { computed, signal } from '@angular/core';

// Private writeable signal
const _loading = signal(false);

// Public readonly computed — components import these
export const isLoading = computed(() => _loading());

// Setter functions — components call these to mutate
export function setLoading(value: boolean): void {
  _loading.set(value);
}

// For objects with multiple sub-properties
const sidebar = signal<SidebarState>({ open: false, title: '' });
export const sidebarOpen = computed(() => sidebar().open);
export const sidebarTitle = computed(() => sidebar().title);
export function openSidebar(title: string): void {
  sidebar.update((s) => ({ ...s, open: true, title }));
}
```

**Rule:** Components import `computed` signals read-only, call exported setter functions to mutate. Never export the raw `signal()` — that enables external `.set()`.

---

### Tier 2 — Hybrid Signal + RxJS in a service (async data + reactive state)

Use when state depends on an HTTP observable chain but must also be readable as a signal.
See `libs/common/src/lib/retrieval-agent/drivers/drivers.service.ts`.

```ts
@Injectable({ providedIn: 'root' })
export class DriversService {
  private sdk = inject(SDKService);
  private toast = inject(SisToastService);

  // ── Private state ────────────────────────────────────────────────
  private _drivers = signal<Driver[]>([]);
  private _refreshTrigger = new BehaviorSubject<void>(undefined); // NOT Subject!

  // ── Public RxJS pipeline (writes to signal as side effect) ───────
  drivers$ = this._refreshTrigger.pipe(
    switchMap(() => this.sdk.currentArag),
    switchMap((arag) => arag.getDrivers()),
    catchError(() => of([])), // REQUIRED — don't skip
    tap((drivers) => this._drivers.set(drivers)), // ← bridge: tap writes signal
    shareReplay(1), // REQUIRED — prevent duplicate requests
  );

  // ── Expose as readonly signal (for template, computed, toSignal) ──
  drivers = this._drivers.asReadonly(); // NOT computed(() => this._drivers())

  // ── Computed values ───────────────────────────────────────────────
  hasDrivers = computed(() => this._drivers().length > 0);

  refresh(): void {
    this._refreshTrigger.next();
  }
}
```

**Critical Tier 2 rules — these are the most common mistakes:**

| ❌ Wrong                                       | ✅ Correct                                      | Why                                                                              |
| ---------------------------------------------- | ----------------------------------------------- | -------------------------------------------------------------------------------- |
| `new Subject<void>()` as trigger               | `new BehaviorSubject<void>(undefined)`          | `Subject` has no initial emission — data never loads until manual `refresh()`    |
| `toSignal(this.drivers$)` in service           | `tap((d) => this._drivers.set(d))` in pipeline  | `toSignal` creates a separate hidden subscription, bypassing `shareReplay` cache |
| `computed(() => this._drivers())` for readonly | `this._drivers.asReadonly()`                    | `computed` adds unnecessary wrapper overhead; `asReadonly()` is the direct API   |
| Skipping `catchError`                          | Always include `catchError(() => of(fallback))` | Uncaught errors complete the observable permanently — no more refreshes          |
| Skipping `shareReplay(1)`                      | Always include at end of pipeline               | Each `async` pipe or subscriber triggers a new HTTP request without it           |

---

### Tier 3 — Pure RxJS BehaviorSubject (services without signal needs)

Use for existing services in `libs/core`, `libs/sync`, `libs/user`, and older parts of `libs/common`.

```ts
@Injectable({ providedIn: 'root' })
export class MyService {
  private _current = new BehaviorSubject<Item | null>(null);

  // Expose only the observable
  current = this._current.asObservable();

  // Snapshot for imperative reads
  getCurrent(): Item | null {
    return this._current.getValue();
  }

  setCurrent(item: Item): void {
    this._current.next(item);
  }
}
```

**When to choose Tier 3 vs Tier 2:** If the template only needs `async` pipe or `toSignal()` at the component level, Tier 3 is fine. Use Tier 2 when the service itself needs to compute or react to the signal.

---

## Template-Bound State Must Use `signal()`

### The rule

**Any component property that is read from a template — via `@if`, `@for`, property binding
`[x]`, interpolation `{{ x }}`, or a condition checked inside an event handler — MUST be
declared as a `signal()`.**

Plain mutable class properties are only acceptable for state that is **never read from a
template** (subscription refs, scratch variables, `@ViewChild` refs used only in methods, etc.).

```ts
// ✅ Correct — template-bound state uses signal()
@Component({ ..., changeDetection: ChangeDetectionStrategy.OnPush })
export class MyComponent {
  isLoading = signal(false);
  items      = signal<Item[]>([]);
  selected   = signal<Item | null>(null);

  // ✅ OK as plain property — never touched by template
  private sub?: Subscription;
  private scratch: number[] = [];
}
```

```ts
// ❌ Wrong — plain properties are invisible to OnPush
@Component({ ..., changeDetection: ChangeDetectionStrategy.OnPush })
export class MyComponent {
  isLoading = false;          // ← @if(isLoading) will NOT update automatically
  items: Item[] = [];         // ← @for(item of items) will NOT update automatically
}
```

### Why

`ChangeDetectionStrategy.OnPush` components only re-render when Angular detects a signal
change (or an `@Input` reference changes). Plain mutable properties are invisible to the
scheduler — they silently fail to trigger re-renders. The only workaround is injecting
`ChangeDetectorRef` and calling `markForCheck()` on every mutation, which is:

- error-prone (easy to forget a mutation site),
- verbose (adds noise to every method that writes state),
- and defeats the entire purpose of OnPush.

### Corollary: remove `ChangeDetectorRef` once all state is signals

Once all template-bound state in a component is declared as `signal()`, injecting
`ChangeDetectorRef` and calling `markForCheck()` / `detectChanges()` becomes unnecessary.
Remove both when refactoring a component to signals.

```ts
// ❌ Legacy pattern — needed only when template reads plain properties
private cdr = inject(ChangeDetectorRef);

loadData(): void {
  this.items = response.data;
  this.cdr.markForCheck();   // ← manual trigger, fragile
}

// ✅ Modern pattern — no ChangeDetectorRef needed
private _items = signal<Item[]>([]);
items = this._items.asReadonly();

loadData(): void {
  this._items.set(response.data);  // ← scheduler notified automatically
}
```

### Two-way bindings with pastanaga/sistema components

`[(value)]` banana-in-a-box syntax is **not used** with `nsi-*` / `pa-*` components. Replace
with explicit signal binding + event handler:

```ts
// ❌ Avoid — banana-in-a-box
<pa-input [(value)]="name"></pa-input>

// ✅ Preferred — signal + explicit event
name = signal('');

// template
<pa-input [value]="name()" (valueChange)="name.set($event)"></pa-input>
```

The `model()` primitive (Angular 17+) is also acceptable but `signal()` + explicit
`(valueChange)` is the established pattern in this codebase — prefer it for consistency.

### Array and object signals — always replace, never mutate in place

Mutating an array element or object property **in place does not trigger signal updates**
because the signal reference is unchanged. Always replace the whole value:

```ts
// ❌ Silent failure — Angular sees same array reference, no update scheduled
const arr = this._items();
arr[i] = updatedItem; // mutates in place
// this._items has NOT changed — no re-render

// ✅ Correct — create new array so signal reference changes
const copy = [...this._items()];
copy[i] = updatedItem;
this._items.set(copy); // new reference → re-render scheduled

// ✅ Also correct for objects
this._config.update((c) => ({ ...c, pageSize: 25 }));
```

The same rule applies to deeply nested objects — spread (or `structuredClone`) to create a
new reference at every level you mutate.

---

## RxJS ↔ Signal Bridge Patterns

```ts
// Observable → Signal (use initialValue to avoid undefined)
items = toSignal(this.service.items$, { initialValue: [] as Item[] });

// Observable → Signal with requireSync (when stream emits synchronously)
count = toSignal(this.service.count$, { requireSync: true });

// Signal → Observable (for passing to rxMethod or operators)
// Just pass the signal reference — Angular reads it reactively
this.service.loadByQuery(this.searchQuery);  // searchQuery is a signal

// Cleanup: new style (preferred in new components)
constructor() {
  this.service.events$
    .pipe(takeUntilDestroyed())
    .subscribe((e) => this.handleEvent(e));
}

// Cleanup: old style (maintain in existing files)
private _destroy = new Subject<void>();
ngOnDestroy(): void { this._destroy.next(); this._destroy.complete(); }
// ...
.pipe(takeUntil(this._destroy))
```

---

## Functional Guards

All guards in `libs/common/src/lib/guards/` follow this pattern:

```ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SDKService, NavigationService } from '@flaps/core';
import { map } from 'rxjs';

export const myFeatureGuard: CanActivateFn = (route) => {
  const sdk = inject(SDKService);
  const navigation = inject(NavigationService);
  const router = inject(Router);

  return sdk.currentKb.pipe(
    map((kb) =>
      kb.someFeature ? true : router.createUrlTree([navigation.getKbUrl(route.paramMap.get('account')!, kb.slug!)]),
    ),
  );
};
```

- Guards return `boolean | UrlTree | Observable<boolean | UrlTree>`
- Use `router.createUrlTree(...)` for redirects, never `router.navigate()` inside a guard
- All `inject()` calls happen at the top of the function body, before any async

---

## Computed Value Readability

When computing a derived stat value (average, percentage, count), **always extract intermediate
steps into named variables** before assembling the final `signal.set()` call. Inline nesting of
`reduce`, `filter`, `Math.round`, and `parseFloat` in the same expression is banned.

```ts
// ❌ Hard to read — everything inline
this._stats.set({
  avgRetrievalTimeMs:
    withRetrieval.length > 0
      ? Math.round(withRetrieval.reduce((sum, i) => sum + i.retrieval_time!, 0) / withRetrieval.length)
      : 0,
});

// ✅ Extract each step into a named variable
const retrievalSum = withRetrieval.reduce((sum, i) => sum + i.retrieval_time!, 0);
const avgRetrievalTimeMs = withRetrieval.length > 0 ? Math.round(retrievalSum / withRetrieval.length) : 0;
this._stats.set({ avgRetrievalTimeMs });

// ✅ Same rule applies to parseFloat + toFixed chains
const remiSum = withRemi.reduce((sum, i) => sum + i.remi_scores!, 0);
const avgRemiScore = withRemi.length > 0 ? parseFloat((remiSum / withRemi.length).toFixed(1)) : 0;
```

Rule of thumb: each line should do **one thing** — a sum, a filter, a rounding, or a guard check.

---

## `as const` Arrays for Type Derivation

When defining a set of string literal union types, prefer defining a `const` array first and
deriving the type from it. This gives you both **runtime iteration** over the values and
**compile-time type safety**:

```ts
// ✅ Preferred: const array → derived type
export const MY_FIELDS = ['field1', 'field2', 'field3'] as const;
export type MyField = (typeof MY_FIELDS)[number];
// MyField = 'field1' | 'field2' | 'field3'

// ✅ Extending a parent set: spread + as const
export const EXTENDED_FIELDS = [...MY_FIELDS, 'extra1', 'extra2'] as const;
export type ExtendedField = (typeof EXTENDED_FIELDS)[number];
```

```ts
// ❌ Avoid: standalone union type that can't be iterated at runtime
export type MyField = 'field1' | 'field2' | 'field3';
// No way to loop over values without duplicating them in an array
```

This pattern is used extensively in SDK model files (e.g., `activity.models.ts` show fields).

---

## Abstract Base Classes

When **3+ services or components** share significant logic (state signals, lifecycle methods,
pipeline patterns), extract an abstract base class rather than duplicating code:

```ts
// metrics/abstract-metrics-page.service.ts — at the module root
@Injectable()
export abstract class AbstractMetricsPageService<T, R = T[]> {
  // inject() works as field initializers in abstract classes
  protected sdk = inject(SDKService);
  protected toast = inject(SisToastService);

  // ── Shared state ────────────────────────────────────────────────
  private _items = signal<R | null>(null);
  items = this._items.asReadonly();

  // ── Protected hooks that subclasses can override ────────────────
  protected _resetPaginationState(): void {
    // Default no-op — subclasses override if they have pagination
  }

  // ── Shared pipeline logic ───────────────────────────────────────
  protected initPipeline(): void {
    // Build the common refresh → switchMap → tap pipeline
  }

  protected loadAvailableMonths(): void {
    // Shared month-loading logic
  }
}
```

**Rules for abstract base classes:**

- Place at the module root (e.g., `metrics/abstract-metrics-page.service.ts`)
- Use generics for item types: `AbstractMetricsPageService<T, R = T[]>`
- Provide protected hook methods (`_resetPaginationState()`) that subclasses can override
- `inject()` as field initializers works with inheritance — no need to pass services via `super()`
- Subclass constructor pattern: `super()` → `this.initPipeline()` → `this.loadAvailableMonths()`

---

## File Splitting Convention: `.model.ts` Files

In addition to the Component / Service / Config trinity, complex components use a
**`.model.ts`** file for interfaces, types, and data models:

| File                        | Content                                                               |
| --------------------------- | --------------------------------------------------------------------- |
| `feature-name.model.ts`     | Interfaces, type aliases, enums, and small data-shape classes         |
| `feature-name.service.ts`   | Business logic: state management, data transformation, condition CRUD |
| `feature-name.component.ts` | Thin UI shell that delegates all logic to the service                 |
| `feature-name.config.ts`    | Static column defs, dropdown options, constants                       |

**When to split:** This applies to complex components with significant logic. Simple components
with 1–2 interfaces can keep them inline or in the service file.

```
activity/
  cost-token-page/
    cost-token-page.component.ts    ← thin UI shell
    cost-token-page.component.html
    cost-token-page.service.ts      ← business logic + state
    cost-token-page.model.ts        ← interfaces and types
    cost-token-page.config.ts       ← static constants
```

---

## Lazy Routing Patterns

Two styles coexist — prefer the route-array style for new features:

```ts
// ── Modern: route array (preferred for new features) ─────────────
{
  path: 'tasks',
  loadChildren: () =>
    import('@flaps/common').then((m) => m.TASK_AUTOMATION_ROUTES),
}

// ── Component-level lazy loading ──────────────────────────────────
{
  path: 'drivers',
  loadComponent: () =>
    import('./drivers/drivers-page.component').then((m) => m.DriversPageComponent),
}

// ── Legacy: NgModule lazy loading (maintain, don't create new) ────
{
  path: 'resources',
  loadChildren: () =>
    import('../../../../libs/common/src/lib/resources/resources.module').then(
      (m) => m.ResourcesModule,
    ),
}
```

Note: The long relative-path imports in app routing (e.g., `../../../../libs/common/...`) are
**intentional** — they bypass Nx module boundary checks for specific lazy-load cases. This pattern
is suppressed with `eslint-disable`. Do not "fix" it by changing to path aliases.

---

## Common Mistakes to Avoid

| Mistake                                                          | Correct approach                                                        |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Nested ternary (`a ? b : c ? d : e`)                             | Use `if / else if` blocks — flat branching is always clearer            |
| `if (cond) { doX(); } else { doY(); }` when one branch returns   | Use guard-clause / early-return: `if (!cond) { doY(); return; } doX();` |
| `constructor(private svc: Service)`                              | `private svc = inject(Service)`                                         |
| `@Input() value: string`                                         | `value = input.required<string>()`                                      |
| `@Output() changed = new EventEmitter<string>()`                 | `changed = output<string>()`                                            |
| `standalone: true` explicitly written                            | Omit it — defaults to `true` in Angular 19+                             |
| `styleUrls: ['./foo.component.scss']` (array)                    | `styleUrl: './foo.component.scss'` (singular string)                    |
| Empty `.scss` file committed for a component                     | Omit `styleUrl` entirely when no styles are needed                      |
| Page component files at the module root                          | Put each page component in a named subfolder (`feature-name/`)          |
| Missing `changeDetection: ChangeDetectionStrategy.OnPush`        | Always include it                                                       |
| `effect()` to derive values                                      | Use `computed()` for derived state                                      |
| `this.signal.set(x)` inside `computed()`                         | Never write inside computed                                             |
| `inject()` inside `ngOnInit`                                     | Move to property initializer or constructor                             |
| Plain property read in template (`isLoading = false`)            | `isLoading = signal(false)` — OnPush won't re-render otherwise          |
| `this.cdr.markForCheck()` after every mutation                   | Convert state to `signal()` and remove `ChangeDetectorRef`              |
| `[(value)]="name"` with nsi-/pa- components                      | `[value]="name()" (valueChange)="name.set($event)"`                     |
| `arr[i] = val` on a signal array                                 | `const copy = [...arr()]; copy[i] = val; arr.set(copy)`                 |
| `new Subject<void>()` as Tier 2 refresh trigger                  | `new BehaviorSubject<void>(undefined)`                                  |
| `toSignal(obs$)` inside a Tier 2 service                         | Use `tap((v) => this._sig.set(v))` in the pipeline                      |
| Omit `shareReplay(1)` on service pipelines                       | Always include — prevents duplicate HTTP requests                       |
| Omit `catchError` on service pipelines                           | Always include — otherwise errors permanently kill the stream           |
| Adding NgRx `signalStore`                                        | Not used in this codebase — use one of the 3 tiers                      |
| Forgetting `takeUntilDestroyed()` on subscriptions in components | Always unsubscribe                                                      |

---

## Reference Files

Load these when you need more depth — don't load proactively, only when relevant:

| File                              | When to load                                                                             |
| --------------------------------- | ---------------------------------------------------------------------------------------- |
| `references/api-cheatsheet.md`    | Need full API signatures for `input()`, `output()`, `signal()`, `computed()`, `effect()` |
| `references/codebase-patterns.md` | Want complete, annotated code examples lifted verbatim from this repo                    |
