# Known Anti-patterns & Locations — Performance Reference

Concrete locations of known performance anti-patterns in the codebase that should be fixed
when those files are touched. Also serves as a catalogue of what "wrong" looks like vs. "right".

---

## Known shareReplay() without buffer argument

These locations use `shareReplay()` (no buffer) which causes a memory leak:

- `apps/manager-v2/src/app/manage-accounts/account.service.ts`
- `libs/common/src/lib/account/billing/history/history.component.ts`

When editing these files, replace `shareReplay()` with `shareReplay(1)`.

---

## Wrong vs Right: shareReplay placement

```ts
// WRONG — shareReplay before catchError replays errors to future subscribers
readonly items$ = this.http.get('/api').pipe(
  shareReplay(1),           // too early
  map(res => res.items),
  catchError(() => of([])),
);

// WRONG — no buffer (memory leak)
readonly items$ = this.http.get('/api').pipe(
  catchError(() => of([])),
  shareReplay(),             // missing buffer
);

// CORRECT
readonly items$ = this.http.get('/api').pipe(
  map(res => res.items),
  catchError(() => of([])),
  shareReplay(1),            // last operator, with buffer
);
```

---

## Wrong vs Right: @for track expressions

```html
<!-- WRONG — loses DOM node identity on list reorder -->
@for (resource of resources(); track $index) {
  <stf-resource-row [resource]="resource" />
}

<!-- CORRECT — stable business key -->
@for (resource of resources(); track resource.id) {
  <stf-resource-row [resource]="resource" />
}

<!-- CORRECT — truly static list (enum tab labels) -->
@for (tab of TABS; track $index) {
  <pa-tab [label]="tab.label" />
}
```

---

## Wrong vs Right: markForCheck vs toSignal

```ts
// WRONG — manual markForCheck in new component
private cdr = inject(ChangeDetectorRef);

ngOnInit() {
  this.service.items$.subscribe(items => {
    this.items = items;
    this.cdr.markForCheck();
  });
}

// CORRECT — toSignal eliminates markForCheck entirely
items = toSignal(this.service.items$, { initialValue: [] });
```

---

## Wrong vs Right: computed() vs getters

```ts
// WRONG — recomputes every CD cycle, no memoisation
get totalPages(): number {
  return Math.ceil(this.pagination().total / this.pagination().size);
}

// CORRECT — memoised, only recomputes when pagination signal changes
readonly totalPages = computed(() =>
  Math.ceil(this.pagination().total / this.pagination().size)
);
```

---

## Wrong vs Right: lazy vs eager routes

```ts
// WRONG — eager loading bloats the initial bundle
{
  path: 'resources',
  component: ResourceListComponent,    // imported directly
}

// CORRECT — lazy loaded (standalone component)
{
  path: 'resources',
  loadComponent: () =>
    import('./resources/resource-list.component').then(m => m.ResourceListComponent),
}
```

---

## Wrong vs Right: debounce on user input

```ts
// WRONG — fires API call on every keystroke
this.searchForm.valueChanges.pipe(
  switchMap(val => this.service.search(val)),
)

// CORRECT
this.searchForm.valueChanges.pipe(
  debounceTime(300),
  distinctUntilChanged(),
  switchMap(val => this.service.search(val)),
)
```

---

## Bundle budget reference

| App | warn | error | Note |
|-----|------|-------|------|
| `dashboard` | 2 MB | 30 MB | Error limit is very lax — don't raise further |
| `manager-v2` | 500 KB | 2 MB | Tighter; meaningful |
| `sistema-demo` | 500 KB | 3 MB | Demo app |

To check actual bundle size after a build:
```bash
nx build dashboard --stats-json
# analyse dist/apps/dashboard/stats.json
```

---

## Virtual scroll threshold

Use `cdk-virtual-scroll-viewport` for any list expected to hold > 100 items.
Reference implementation: `apps/dashboard/src/app/.../activity` (activity log component).

For incrementally-growing lists: `manager-v2` slice pattern — start with 100, add 100 on scroll.
