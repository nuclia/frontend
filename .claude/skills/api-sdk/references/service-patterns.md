# SDK Service Patterns — API Reference

Canonical Angular service patterns for wrapping `@nuclia/core` SDK calls in `@flaps/core`.

---

## Pattern 1 — Global (non-KB) endpoint

Use when the API call does not require a Knowledge Box context.

```ts
// libs/core/src/lib/api/my-feature.service.ts
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError, of } from 'rxjs';
import { SDKService } from './sdk.service';
import { SisToastService } from '@nuclia/sistema';
import { MyModel } from '@nuclia/core';

@Injectable({ providedIn: 'root' })
export class MyFeatureService {
  private sdk = inject(SDKService);
  private toast = inject(SisToastService);

  getItems(): Observable<MyModel[]> {
    return this.sdk.nuclia.rest.get<MyModel[]>('/my-endpoint').pipe(
      catchError((err) => {
        this.toast.error('my-feature.load.error');
        return of([]);
      }),
    );
  }

  createItem(data: Partial<MyModel>): Observable<MyModel | null> {
    return this.sdk.nuclia.rest.post<MyModel>('/my-endpoint', data).pipe(
      catchError((err) => {
        this.toast.error('my-feature.create.error');
        return of(null);
      }),
    );
  }
}
```

---

## Pattern 2 — KB-level endpoint (reactive to current KB)

Use when the call must operate on the active Knowledge Box. Chaining off `sdk.currentKb`
automatically cancels in-flight requests when the user switches KBs.

```ts
@Injectable({ providedIn: 'root' })
export class KbFeatureService {
  private sdk = inject(SDKService);
  private toast = inject(SisToastService);

  // Emits fresh data every time the current KB changes
  readonly data$ = this.sdk.currentKb.pipe(
    switchMap((kb) =>
      kb.nuclia.rest.get<MyKbModel>(`${kb.path}/my-kb-endpoint`, undefined, false, kb.zone).pipe(
        catchError(() => of(null)),
      ),
    ),
    shareReplay(1),
  );

  // One-shot action on the current KB
  doAction(id: string): Observable<void> {
    return this.sdk.currentKb.pipe(
      take(1),
      switchMap((kb) =>
        kb.nuclia.rest.post<void>(`${kb.path}/action`, { id }, undefined, false, false, kb.zone),
      ),
      catchError((err) => {
        this.toast.error('kb-feature.action.error');
        return EMPTY;
      }),
    );
  }
}
```

---

## Pattern 3 — Adding a method to KnowledgeBox (SDK layer)

When the operation belongs to the SDK public API (i.e., multiple consumers will use it):

```ts
// libs/sdk-core/src/lib/db/kb/kb.ts — inside KnowledgeBox class

getMyConfig(): Observable<MyConfig> {
  return this.nuclia.rest.get<MyConfig>(`${this.path}/my-config`);
}

// WritableKnowledgeBox — for write operations
setMyConfig(config: MyConfig): Observable<void> {
  return this.nuclia.rest.put<void>(`${this.path}/my-config`, config);
}
```

Then consume via Angular service:
```ts
return this.sdk.currentKb.pipe(
  take(1),
  switchMap((kb) => (kb as WritableKnowledgeBox).setMyConfig(config)),
);
```

---

## Pattern 4 — Search / Ask with IErrorResponse guard

```ts
search(query: string): Observable<Resource[]> {
  return this.sdk.currentKb.pipe(
    take(1),
    switchMap((kb) =>
      kb.find(query, [Search.Features.KEYWORD, Search.Features.SEMANTIC]).pipe(
        map((result) => {
          if (result.type === 'error') {
            console.error('Search error', result.status, result.detail);
            this.toast.error('search.error');
            return [];
          }
          return Object.values(result.resources ?? {});
        }),
      ),
    ),
    catchError(() => of([])),
  );
}
```

Key: `search()`, `find()`, `ask()`, `catalog()` return `T | IErrorResponse`. They do NOT throw.
Always check `result.type === 'error'` before accessing the result data.

---

## Pattern 5 — Upload with retry on 429

```ts
import { retry, retry429Config } from '@nuclia/core';

uploadFile(file: File): Observable<void> {
  return this.sdk.currentKb.pipe(
    take(1),
    switchMap((kb) =>
      (kb as WritableKnowledgeBox).upload(file.name, file).pipe(
        retry(retry429Config),
      ),
    ),
    catchError((err) => {
      this.toast.error('upload.error');
      return EMPTY;
    }),
  );
}
```

---

## URL reference: path vs fullpath

| Property | Format | When to use |
|----------|--------|-------------|
| `kb.path` | `/kb/<uuid>` | Inside SDK methods — combined with `zoneSlug` on `rest.*` |
| `kb.fullpath` | `https://<zone>.rag.../v1/kb/<uuid>` | Only for absolute URLs needed by external libs |
| `nuclia.rest.get(path, h, p, zoneSlug)` | Relative path + zone | Preferred for regional calls |
| `nuclia.rest.get(absoluteUrl)` | Full `https://...` URL | Fallback; avoids needing the zone param |

Always prefer `kb.path` + `zoneSlug` form inside `KnowledgeBox` methods.

---

## Where to export new models

1. Add type to `kb.models.ts` or `db.models.ts`.
2. It is re-exported automatically via `export * from './lib/db'` in `src/index.ts`.
3. Consumers import from `@nuclia/core` — never from a relative path.

---

## SDKService reactive streams reference

| Stream | Type | Updates when |
|--------|------|--------------|
| `sdk.currentKb` | `Observable<WritableKnowledgeBox>` | User selects a different KB |
| `sdk.currentArag` | `Observable<RetrievalAgent>` | User selects a different ARAG |
| `sdk.currentAccount` | `Observable<Account>` | Account data refreshed |
| `sdk.kbList` | `Observable<IKnowledgeBoxItem[]>` | KB list refreshed or KB created/deleted |
| `sdk.aragList` | `Observable<IRetrievalAgentItem[]>` | ARAG list refreshed |
| `sdk.nuclia` | `Nuclia` (sync) | Never (stable instance per session) |
