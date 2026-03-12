````skill
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

## Component Skeleton

```ts
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { TranslateModule } from '@ngx-translate/core';
import { PaButtonModule } from '@guillotinaweb/pastanaga-angular';
import { SomeService } from './some.service';

@Component({
  selector: 'stf-my-feature',      // prefix from project.json
  imports: [TranslateModule, PaButtonModule],
  templateUrl: './my-feature.component.html',
  styleUrl: './my-feature.component.scss',   // singular string, NOT styleUrls: [...]
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyFeatureComponent {
  // ── Services ────────────────────────────────────────────────────
  private someService = inject(SomeService);

  // ── Inputs (signal-based) ────────────────────────────────────────
  itemId  = input.required<string>();
  label   = input('', { transform: (v: string) => v.trim() });

  // ── Outputs ──────────────────────────────────────────────────────
  deleted = output<string>();        // emit the id, never 'onDeleted'

  // ── Local state ──────────────────────────────────────────────────
  private loading = signal(false);

  // ── Derived state ────────────────────────────────────────────────
  isReady = computed(() => !!this.itemId() && !this.loading());

  // ── Bridge from RxJS observable ──────────────────────────────────
  items = toSignal(this.someService.items$, { initialValue: [] });

  // ── Cleanup (new style) ──────────────────────────────────────────
  constructor() {
    this.someService.events$
      .pipe(takeUntilDestroyed())
      .subscribe((event) => this.handleEvent(event));
  }

  delete(): void {
    this.loading.set(true);
    this.someService.delete(this.itemId()).subscribe({
      next: () => this.deleted.emit(this.itemId()),
      error: () => this.loading.set(false),
    });
  }

  private handleEvent(event: unknown): void { /* ... */ }
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
export const sidebarOpen  = computed(() => sidebar().open);
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
  private sdk   = inject(SDKService);
  private toast = inject(SisToastService);

  // ── Private state ────────────────────────────────────────────────
  private _drivers        = signal<Driver[]>([]);
  private _refreshTrigger = new BehaviorSubject<void>(undefined); // NOT Subject!

  // ── Public RxJS pipeline (writes to signal as side effect) ───────
  drivers$ = this._refreshTrigger.pipe(
    switchMap(() => this.sdk.currentArag),
    switchMap((arag) => arag.getDrivers()),
    catchError(() => of([])),               // REQUIRED — don't skip
    tap((drivers) => this._drivers.set(drivers)),  // ← bridge: tap writes signal
    shareReplay(1),                         // REQUIRED — prevent duplicate requests
  );

  // ── Expose as readonly signal (for template, computed, toSignal) ──
  drivers = this._drivers.asReadonly();     // NOT computed(() => this._drivers())

  // ── Computed values ───────────────────────────────────────────────
  hasDrivers = computed(() => this._drivers().length > 0);

  refresh(): void {
    this._refreshTrigger.next();
  }
}
```

**Critical Tier 2 rules — these are the most common mistakes:**

| ❌ Wrong | ✅ Correct | Why |
|---|---|---|
| `new Subject<void>()` as trigger | `new BehaviorSubject<void>(undefined)` | `Subject` has no initial emission — data never loads until manual `refresh()` |
| `toSignal(this.drivers$)` in service | `tap((d) => this._drivers.set(d))` in pipeline | `toSignal` creates a separate hidden subscription, bypassing `shareReplay` cache |
| `computed(() => this._drivers())` for readonly | `this._drivers.asReadonly()` | `computed` adds unnecessary wrapper overhead; `asReadonly()` is the direct API |
| Skipping `catchError` | Always include `catchError(() => of(fallback))` | Uncaught errors complete the observable permanently — no more refreshes |
| Skipping `shareReplay(1)` | Always include at end of pipeline | Each `async` pipe or subscriber triggers a new HTTP request without it |

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
  const sdk        = inject(SDKService);
  const navigation = inject(NavigationService);
  const router     = inject(Router);

  return sdk.currentKb.pipe(
    map((kb) =>
      kb.someFeature
        ? true
        : router.createUrlTree([navigation.getKbUrl(route.paramMap.get('account')!, kb.slug!)]),
    ),
  );
};
```

- Guards return `boolean | UrlTree | Observable<boolean | UrlTree>`
- Use `router.createUrlTree(...)` for redirects, never `router.navigate()` inside a guard
- All `inject()` calls happen at the top of the function body, before any async

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

| Mistake | Correct approach |
|---|---|
| `constructor(private svc: Service)` | `private svc = inject(Service)` |
| `@Input() value: string` | `value = input.required<string>()` |
| `@Output() changed = new EventEmitter<string>()` | `changed = output<string>()` |
| `standalone: true` explicitly written | Omit it — defaults to `true` in Angular 19+ |
| `styleUrls: ['./foo.component.scss']` (array) | `styleUrl: './foo.component.scss'` (singular string) |
| Missing `changeDetection: ChangeDetectionStrategy.OnPush` | Always include it |
| `effect()` to derive values | Use `computed()` for derived state |
| `this.signal.set(x)` inside `computed()` | Never write inside computed |
| `inject()` inside `ngOnInit` | Move to property initializer or constructor |
| `new Subject<void>()` as Tier 2 refresh trigger | `new BehaviorSubject<void>(undefined)` |
| `toSignal(obs$)` inside a Tier 2 service | Use `tap((v) => this._sig.set(v))` in the pipeline |
| Omit `shareReplay(1)` on service pipelines | Always include — prevents duplicate HTTP requests |
| Omit `catchError` on service pipelines | Always include — otherwise errors permanently kill the stream |
| Adding NgRx `signalStore` | Not used in this codebase — use one of the 3 tiers |
| Forgetting `takeUntilDestroyed()` on subscriptions in components | Always unsubscribe |

---

## Reference Files

Load these when you need more depth — don't load proactively, only when relevant:

| File | When to load |
|------|-------------|
| `references/api-cheatsheet.md` | Need full API signatures for `input()`, `output()`, `signal()`, `computed()`, `effect()` |
| `references/codebase-patterns.md` | Want complete, annotated code examples lifted verbatim from this repo |
````
