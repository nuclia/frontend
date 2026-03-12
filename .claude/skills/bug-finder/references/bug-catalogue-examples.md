# Real-world Bug Examples — Bug Finder Reference

Concrete examples of each bug category pulled from patterns seen in this codebase.
Use these as calibration: if new code looks like the "wrong" column, it's a real bug.

---

## Memory Leaks — RxJS Subscriptions

### Missing takeUntilDestroyed
```ts
// BUG (LEAK): subscription never cleaned up
ngOnInit() {
  this.service.items$.subscribe(items => {
    this.items = items;
  });
}

// CORRECT
items = toSignal(this.service.items$, { initialValue: [] });
// OR
ngOnInit() {
  this.service.items$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(items => {
    this.items = items;
  });
}
```

### shareReplay without bufferSize or refCount
```ts
// BUG (LEAK): internal buffer and HTTP connection kept alive indefinitely
readonly data$ = this.http.get('/api/data').pipe(
  shareReplay()   // should be shareReplay(1)
);
```

---

## Race Conditions — Wrong Flattening Operator

### Search-as-you-type with mergeMap
```ts
// BUG (RACE): old slow response can overwrite a newer fast response
searchTerm$.pipe(
  debounceTime(300),
  mergeMap(term => this.search(term)),  // should be switchMap
)

// CORRECT: switchMap cancels the previous request
searchTerm$.pipe(
  debounceTime(300),
  switchMap(term => this.search(term)),
)
```

### Form submit with mergeMap (duplicate submissions)
```ts
// BUG (RACE): user can trigger two simultaneous POST requests
submitButton.clicks$.pipe(
  mergeMap(() => this.service.save(this.form.value)),  // should be exhaustMap
)

// CORRECT: exhaustMap ignores clicks while save is in-flight
submitButton.clicks$.pipe(
  exhaustMap(() => this.service.save(this.form.value)),
)
```

---

## Silent Error Swallowing

### catchError returning EMPTY with no log
```ts
// BUG: error is completely invisible — no log, no toast, no rethrow
return this.service.loadData().pipe(
  catchError(() => EMPTY)
);

// CORRECT
return this.service.loadData().pipe(
  catchError((err) => {
    console.error('Failed to load data', err);
    this.toast.error('data.load.error');
    return of([]);
  }),
);
```

---

## Angular Change Detection Bugs

### In-place array mutation with OnPush
```ts
// BUG: OnPush won't re-render because the array reference didn't change
addItem(item: Resource) {
  this.items.push(item);           // reference unchanged
  // template will NOT update
}

// CORRECT
addItem(item: Resource) {
  this.items = [...this.items, item];  // new reference triggers OnPush
}

// CORRECT with signals
items = signal<Resource[]>([]);
addItem(item: Resource) {
  this.items.update(list => [...list, item]);
}
```

### WebSocket callback outside Angular zone
```ts
// BUG: ws.onmessage runs outside Angular zone — OnPush component won't update
this.ws.onmessage = (event) => {
  this.messages.push(JSON.parse(event.data));
};

// CORRECT: run inside zone
this.ws.onmessage = (event) => {
  this.zone.run(() => {
    this.messages.update(list => [...list, JSON.parse(event.data)]);
  });
};
```

---

## Null / Undefined Dereference

### Accessing property on nullable signal value
```ts
// BUG: selectedResource() could be null on first render
get resourceTitle(): string {
  return this.selectedResource().title;   // crashes if null
}

// CORRECT
get resourceTitle(): string {
  return this.selectedResource()?.title ?? '';
}
```

### ViewChild used before ngAfterViewInit
```ts
// BUG: @ViewChild is undefined in ngOnInit
@ViewChild('chart') chartRef!: ElementRef;

ngOnInit() {
  this.renderChart(this.chartRef.nativeElement);  // undefined here
}

// CORRECT
ngAfterViewInit() {
  this.renderChart(this.chartRef.nativeElement);  // safe here
}
```

---

## Form Bugs

### Using .value instead of .getRawValue() with disabled controls
```ts
// BUG: disabled controls are excluded from .value
const formData = this.form.value;    // misses disabled fields
this.service.save(formData);         // sends incomplete data

// CORRECT: getRawValue() includes all controls regardless of disabled state
const formData = this.form.getRawValue();
this.service.save(formData);
```

---

## IErrorResponse not checked (SDK-specific)

### search/find/ask/catalog without error guard
```ts
// BUG: result.resources would crash if result is IErrorResponse
kb.search(query, features).pipe(
  map(result => result.resources ?? []),  // crashes if result.type === 'error'
)

// CORRECT
kb.search(query, features).pipe(
  map(result => {
    if (result.type === 'error') {
      console.error('Search failed', result.status);
      return [];
    }
    return Object.values(result.resources ?? {});
  }),
)
```
