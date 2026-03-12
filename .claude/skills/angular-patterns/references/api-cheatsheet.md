# Angular 21 API Cheatsheet

Quick-reference for signal APIs, DI, and interop utilities as of Angular 21.

---

## `signal()`

```ts
import { signal, isSignal, isWritableSignal } from '@angular/core';

const count = signal(0);                          // WritableSignal<number>
count.set(3);
count.update(v => v + 1);
const readonly = count.asReadonly();              // Signal<number>

// Custom equality (prevents unnecessary recomputation)
const list = signal(['a'], { equal: (a, b) => JSON.stringify(a) === JSON.stringify(b) });

isSignal(count);           // true
isWritableSignal(count);   // true
isWritableSignal(readonly); // false
```

---

## `computed()`

```ts
import { computed } from '@angular/core';

const doubled = computed(() => count() * 2);      // Signal<number> — lazy, memoized

// Computed signals are read-only
doubled();          // ✅ read
doubled.set(10);    // ❌ compile error

// Dynamic dependencies — only signals actually read during the previous execution are tracked
const result = computed(() => {
  if (condition()) {
    return a();     // 'b' not tracked when condition is true
  }
  return b();
});
```

---

## `effect()`

```ts
import { effect, untracked } from '@angular/core';

// Runs in injection context (constructor or field initializer)
effect(() => {
  console.log('count changed:', count());
});

// Avoid re-triggering on a secondary signal
effect(() => {
  const user = currentUser();
  untracked(() => loggingService.log(user));  // loggingService reads don't track
});

// Cleanup
effect((onCleanup) => {
  const timer = setTimeout(() => {}, 1000);
  onCleanup(() => clearTimeout(timer));
});
```

**When to use:** Only for non-reactive side effects (DOM manipulation, logging, analytics). Use `computed()` for derived values.

---

## `input()` — Signal-Based Inputs

```ts
import { input, booleanAttribute, numberAttribute } from '@angular/core';

// Optional with default
value = input(0);                                // InputSignal<number>

// Optional without default
value = input<number>();                         // InputSignal<number | undefined>

// Required — Angular enforces at compile time
value = input.required<number>();                // InputSignal<number>

// With transform
label    = input('', { transform: (v: string) => v.trim() });
disabled = input(false, { transform: booleanAttribute });
count    = input(0,     { transform: numberAttribute });

// With alias (rarely needed)
value = input(0, { alias: 'sliderValue' });

// Read in template or computed
fullLabel = computed(() => `(${this.count()}) ${this.label()}`);
```

**Do not** prefix input names (no `myComponentValue` — just `value`).

---

## `output()` — Signal-Based Outputs

```ts
import { output } from '@angular/core';

// Void event
closed    = output<void>();
// Data event
selected  = output<Item>();
// With alias
saved     = output<Item>({ alias: 'itemSaved' });

// Emit
this.closed.emit();
this.selected.emit(item);
```

**Naming:** past-tense verbs (`deleted`, `saved`, `closed`). Never prefix with `on`.

---

## `model()` — Two-Way Binding

```ts
import { model } from '@angular/core';

checked = model(false);             // ModelSignal<boolean>
checked.set(true);
checked.update(v => !v);
// Implicitly creates a 'checkedChange' output
```

Use `model()` instead of `input + output` pairs when the intent is two-way binding (toggle, slider, combo).

---

## `inject()`

```ts
import { inject, InjectionToken } from '@angular/core';

// In service property initializer — preferred
@Injectable({ providedIn: 'root' })
class MyService {
  private http   = inject(HttpClient);
  private sdk    = inject(SDKService);
  private toast  = inject(SisToastService);
}

// In component — same pattern
export class MyComponent {
  private service = inject(MyService);
}

// In functional guard
export const myGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.isAuthenticated();
};

// Optional injection
const config = inject(CONFIG_TOKEN, { optional: true });

// InjectionToken with factory
const BASE_URL = new InjectionToken<string>('BASE_URL', {
  factory: () => '/api',
});
```

**Rule:** Call `inject()` only in injection context (constructor, field initializer, `withMethods`/`withComputed`, functional guards/resolvers, `runInInjectionContext()`). Never inside `ngOnInit`, `ngOnChanges`, or event handlers.

---

## `toSignal()` and `takeUntilDestroyed()` — RxJS Interop

```ts
import { toSignal, takeUntilDestroyed, outputFromObservable, outputToObservable } from '@angular/core/rxjs-interop';

// Observable → Signal
items    = toSignal(this.service.items$, { initialValue: [] as Item[] });
selected = toSignal(this.service.selected$);               // Signal<T | undefined>

// When the observable emits synchronously (e.g. BehaviorSubject)
count = toSignal(this.service.count$, { requireSync: true }); // Signal<number> (no undefined)

// Cleanup — call in injection context
constructor() {
  this.service.events$
    .pipe(takeUntilDestroyed())
    .subscribe((e) => this.handle(e));
}

// Inject DestroyRef for use outside injection context
const destroyRef = inject(DestroyRef);
somePromise.then(() => {
  obs$.pipe(takeUntilDestroyed(destroyRef)).subscribe(...);
});
```

---

## `viewChild()` and `contentChild()` — Signal-Based Queries (Angular 17+)

```ts
import { viewChild, contentChild, viewChildren, ElementRef } from '@angular/core';

inputEl  = viewChild<ElementRef>('inputRef');       // Signal<ElementRef | undefined>
inputEl  = viewChild.required<ElementRef>('inputRef'); // Signal<ElementRef>
items    = viewChildren(ItemComponent);              // Signal<readonly ItemComponent[]>
```

Note: `@ViewChild` / `@ContentChild` decorators are still valid and common in this codebase. Prefer signal queries for new standalone components.

---

## `linkedSignal()` — Writable Derived Signal (Angular 19+)

```ts
import { linkedSignal } from '@angular/core';

const options  = signal(['a', 'b', 'c']);
// Resets to options()[0] whenever options changes, but can also be set manually
const selected = linkedSignal(() => options()[0]);
selected.set('b');   // manual override
```

Use when you need a signal that resets based on another but can also be imperatively set.

---

## `resource()` — Async Data (Angular 19+)

```ts
import { resource } from '@angular/core';

const userId = signal(1);
const user = resource({
  request: () => userId(),              // reactive request; re-runs when userId changes
  loader: ({ request }) => fetch(`/api/users/${request}`).then(r => r.json()),
});

user.value();     // Signal<User | undefined>
user.isLoading(); // Signal<boolean>
user.error();     // Signal<unknown>
user.reload();    // manual refresh
```

Use `resource()` when you have a signal-driven async data source. For Observable-based data, prefer `toSignal()` with an existing RxJS pipeline.

---

## Common Angular 21 Pitfalls

| Mistake | Fix |
|---|---|
| Reading signal after `await` in `effect()` | Read all signals before `await` — reactive context is lost across async boundaries |
| `computed(() => { signal.set(x); return y; })` | Never write to signals inside computed |
| `inject()` inside `ngOnInit` | Move to property initializer or constructor |
| `input<number>()` without handling `undefined` | Either use `input.required<number>()` or handle `undefined` |
| `output()` name matching native DOM event (`click`, `change`) | Always use custom names |
| Passing `signal()` value to `rxMethod`: `store.search(query())` | Pass signal reference: `store.search(query)` |
| `effect()` for derived values | Use `computed()` or `linkedSignal()` |
