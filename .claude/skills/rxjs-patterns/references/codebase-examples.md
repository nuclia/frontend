# RxJS Codebase Examples

Annotated real examples from this repo. Each annotation explains *why* the pattern was chosen,
not just what it does.

---

## 1. Mixing `BehaviorSubject` and `ReplaySubject(1)` in One Service

**File:** `libs/core/src/lib/api/sdk.service.ts`

```ts
// BehaviorSubject — has a meaningful "empty" initial value (null = not set yet)
private _account = new BehaviorSubject<Account | null>(null);
private _kb      = new BehaviorSubject<KnowledgeBox | null>(null);
private _arag    = new BehaviorSubject<RetrievalAgent | null>(null);

// BehaviorSubject — boolean flags have clear false-initial-values
private _refreshingKbList = new BehaviorSubject<boolean>(false);

// ReplaySubject(1) — no good initial value; first real emit comes from HTTP
// Late subscribers get the last KB without seeing a null first
private _currentKB         = new ReplaySubject<WritableKnowledgeBox>(1);
private _currentArag        = new ReplaySubject<RetrievalAgent>(1);
private _kbList             = new ReplaySubject<IKnowledgeBoxItem[]>(1);
private _aragListWithMemory = new ReplaySubject<IRetrievalAgentItem[]>(1);

// Subject — pure event; no current value needed; used only as a one-way trigger
private _triggerRefreshKbs   = new Subject<boolean>();
private _triggerRefreshArags = new Subject<boolean>();
private _refreshCounter      = new Subject<boolean>();

// Public surface — always expose via asObservable() to prevent external .next()
currentKb  = this._currentKB.asObservable();
currentArag = this._currentArag.asObservable();
kbList      = this._kbList.asObservable();

// Derived — combineLatest because both sources update independently
isAragWithMemory = combineLatest([this._currentArag, this.aragListWithMemory]).pipe(
  map(([currentArag, withMemory]) => withMemory.some((a) => a.id === currentArag.id)),
);
```

**Key takeaways:**
- Three Subject types in the same service, each chosen for a different reason
- `asObservable()` on every public property — never expose the Subject itself
- `combineLatest` for derived state that depends on two streams that update independently

---

## 2. `combineLatest` + `shareReplay(1)` Chains

**File:** `libs/core/src/lib/analytics/feature-flag.service.ts`

```ts
// shareReplay(1) on an intermediate derived stream — prevents recomputing md5
// for every combineLatest consumer that uses accountMd5
private accountMd5 = this.sdk.hasAccount.pipe(
  switchMap((hasAccount) =>
    hasAccount
      ? this.sdk.currentAccount.pipe(
          map((account) => SparkMD5.hash(account.id)),
          shareReplay(1),   // ← mid-chain shareReplay: multiple downstream consumers
        )
      : of(''),
  ),
);

// fromFetch → parse JSON → shareReplay prevents re-fetching for each combineLatest
private featuresData = fromFetch(`${this.backendConfig.getCDN()}/features/features-v2.json`).pipe(
  switchMap((res) => res.json()),
  map((res) => res as FeaturesData),
  shareReplay(1),   // ← one HTTP request regardless of how many downstreams subscribe
);

// combineLatest — features depends on both data sources updating in tandem
private applicationRemoteFeatures = combineLatest([
  this.featuresData,   // ← HTTP data, via shareReplay(1) above
  this.accountMd5,     // ← derived from account, via shareReplay(1) above
]).pipe(
  map(([data, md5]) => {
    // ... transform
  }),
);
```

**Key takeaways:**
- `shareReplay(1)` placed on *intermediate* streams that are consumed by multiple `combineLatest` calls — not just at the top-level service pipeline
- `fromFetch` is the RxJS-native way to wrap `fetch()` — `switchMap` parses the `Response`
- No `catchError` here because `featuresData` failing is handled upstream by the caller

---

## 3. `concatMap` for Sequential Dependent Steps

**File:** `libs/common/src/lib/upload/upload.service.ts`

```ts
// concatMap — step 2 must wait for step 1 to complete
// (can't upload if the label set doesn't exist yet)
this.createMissingLabels(labels).pipe(
  concatMap(() =>
    this.uploadFiles(files, (progress) => {
      if (progress.completed) {
        this.onUploadComplete(/* ... */);
      }
    }),
  ),
  startWith({ files: [], progress: 0, completed: false, /* ... */ }),
).subscribe((progress) => {
  this._progress.next(progress);
});
```

And parallel md5 computation followed by KB upload:

```ts
uploadFiles(files: File[]): Observable<UploadStatus> {
  // forkJoin — compute all md5s in parallel (order irrelevant, wait for all)
  return forkJoin(files.map((file) => md5(file))).pipe(
    switchMap((fileList) =>
      this.sdk.currentKb.pipe(
        take(1),                            // ← snapshot: don't re-subscribe when KB changes
        switchMap((kb) => kb.batchUpload(fileList)),
      ),
    ),
  );
}
```

**Key takeaways:**
- `concatMap` for "step A then step B" when both are observables and B depends on A completing
- `forkJoin` to parallelise independent computations then wait for all before proceeding
- `take(1)` before a write operation to snapshot current state

---

## 4. Inner `catchError` — Keeping the Outer Stream Alive

**File:** `libs/common/src/lib/entities/ner.service.ts`

```ts
constructor() {
  this.sdk.currentKb.pipe(
    tap(() => {
      this.entitiesSubject.next(null);   // ← reset state on context switch
    }),
    filter((kb) => !!kb),
    switchMap((kb) =>
      kb.getEntities().pipe(
        // catchError is INSIDE the switchMap callback, not outside
        // If one KB's entities fail to load, the stream survives for future KB changes
        catchError(() => EMPTY),
      ),
    ),
  ).subscribe({
    next: (entities) => this.entitiesSubject.next(mapEntities(entities)),
    error: () => this.entitiesSubject.next(null),   // ← defensive; outer errors still handled
  });
}

private _refreshFamily(kb: IKnowledgeBox, familyId: string): Observable<EntitiesGroup> {
  return kb.getEntitiesGroup(familyId).pipe(
    catchError(() => EMPTY),   // ← EMPTY: silent failure; caller handles undefined case
    tap((family) => {
      this.entitiesSubject.next({
        ...this.entitiesSubject.getValue(),
        [familyId]: { ...family, key: familyId },
      });
    }),
  );
}
```

**Key takeaways:**
- `catchError` inside `switchMap` callback = outer stream stays alive through errors
- `EMPTY` as the error fallback: nothing emits, nothing breaks, no misleading state
- `tap(() => subject.next(null))` before `switchMap` resets state visually while new data loads
- `this.entitiesSubject.getValue()` — `BehaviorSubject.getValue()` for synchronous snapshot when merging

---

## 5. Reactive URL Derivation with `combineLatest`

**File:** `libs/core/src/lib/services/navigation.service.ts`

```ts
// Two streams update independently (account slug or kb slug can change separately)
// combineLatest ensures URL updates whenever either changes
homeUrl: Observable<string> = combineLatest([
  this.sdk.currentAccount,
  this.sdk.currentKb,
  this.sdk.arag,
]).pipe(
  map(([account, kb, arag]) => buildHomeUrl(account, kb, arag)),
);

kbUrl = combineLatest([this.sdk.currentAccount, this.sdk.currentKb]).pipe(
  map(([account, kb]) => `/${account.slug}/${kb.slug}/`),
);

// forkJoin + take(1) for one-shot navigation targets
// (We need both values once, not a live stream)
getKbModificationUrl(...): Observable<string> {
  return forkJoin([
    this.sdk.currentAccount.pipe(take(1)),
    this.sdk.currentKb.pipe(take(1)),
  ]).pipe(
    map(([account, kb]) => `/manage/${account.slug}/${kb.slug}/edit`),
  );
}
```

**Key takeaways:**
- `combineLatest` for continuously reactive derived values (live URL in a header)
- `forkJoin` + `take(1)` for one-shot imperative lookups inside methods
- No `shareReplay` needed on these derived streams because `combineLatest` sources already replay (they're `ReplaySubject`-backed)

---

## 6. `debounceTime` + `switchMap` for Search

**File:** `libs/common/src/lib/search-widget/search-widget.service.ts`

```ts
searchQuery$.pipe(
  debounceTime(300),          // ← wait 300ms of silence before firing
  switchMap((query) =>         // ← cancel previous in-flight request
    this.api.search(query).pipe(
      catchError(() => of({ results: [] })),
    ),
  ),
  shareReplay(1),
)
```

**Key takeaways:**
- `debounceTime` before `switchMap` is the canonical "typeahead" pattern
- `switchMap` cancels the previous HTTP request — essential for search
- `catchError` inside `switchMap` so a failed search doesn't kill the query stream

---

## 7. `auditTime` for DOM Events

**File:** `libs/common/src/lib/retrieval-agent/agent-dashboard/agent-dashboard.component.ts`

```ts
constructor() {
  fromEvent(window, 'resize').pipe(
    auditTime(100),                       // ← not debounceTime
    takeUntil(this.unsubscribeAll),
  ).subscribe(() => this.recalculateLayout());
}
```

**Why `auditTime` not `debounceTime` here:**
`debounceTime` restarts its timer on every event, so it can be starved (never fires) while the user continuously resizes. `auditTime` fires once per window regardless of how many events arrived — at most once every 100ms.

---

## 8. `startWith` for UI Loading State

**File:** `libs/common/src/lib/upload/upload.service.ts`

```ts
uploadInProgress = combineLatest([
  this.progress.pipe(startWith(null)),   // ← startWith(null) so combineLatest fires immediately
  this._bulkUploadInProgress,            // ← BehaviorSubject already has initial value
]).pipe(
  map(([progress, bulkInProgress]) =>
    (progress !== null && !progress.completed) || bulkInProgress,
  ),
);
```

**Key takeaways:**
- `startWith(null)` on a `ReplaySubject`-backed stream to make `combineLatest` emit immediately (before the first real progress event arrives)
- Without `startWith`, `combineLatest` would wait for `progress` to emit before `uploadInProgress` produces any value
