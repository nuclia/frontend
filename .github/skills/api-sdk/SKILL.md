---
name: api-sdk
description: >
  How Angular code in this monorepo calls the Nuclia API through the @nuclia/core SDK.
  Covers URL routing (global vs regional backends), error handling patterns, wrapping
  SDK calls in Angular services in @flaps/core (SDKService), and adding new API calls.
  Activate this skill whenever a task
  involves calling the Nuclia API, adding a new endpoint, extending KnowledgeBox or RetrievalAgent,
  creating an Angular service that fetches data, working with SDKService, or handling HTTP errors.
  Do not wait for the user to say "SDK" — if they ask for "a service that fetches X from the API"
  or "add support for endpoint Y", this skill applies.
---

# API & SDK — Nuclia Frontend Monorepo

This skill describes how Angular services in `@flaps/core` wrap `@nuclia/core` (the JS/TS SDK).
Before adding any new API call, read this to avoid duplicating logic or bypassing the SDK entirely.

---

## SDK Reference

The SDK's structure, class hierarchy (`Nuclia`, `Db`, `KnowledgeBox`, `RetrievalAgent`), `Rest` primitives and conventions live in `libs/sdk-core/AGENTS.md`; read it, and the source, before adding or changing a call. The essentials:

- **Every SDK method returns an `Observable<T>`.** Never use Promises internally — use `asyncKnowledgeBox` only when an external caller requires a Promise.
- Auth headers are added automatically — never set `Authorization` manually.
- Pass `synchronous = true` to write operations that must wait for the backend to finish.

---

## URL Routing: Global vs Regional

The Nuclia API has two base URLs:

| Scope        | Base URL                                                          | When to use                           |
| ------------ | ----------------------------------------------------------------- | ------------------------------------- |
| **Global**   | `nuclia.backend` → `https://accounts.progress.cloud/api`          | Account CRUD, zones list, NUA clients |
| **Regional** | `nuclia.regionalBackend` → `https://<zone>.dp.progress.cloud/api` | KB-level & ARAG operations            |

`nuclia.rest.get(path)` targets the **global** backend by default.
To target the regional backend, pass the `zoneSlug` as the 4th argument OR use `kb.path`/`kb.fullpath`:

```ts
// Global endpoint — no zone needed
this.nuclia.rest.get<Zone[]>('/zones');

// Regional endpoint via zoneSlug param
this.nuclia.rest.get<MyModel>('/v1/kb/<id>/something', undefined, false, 'europe-1');

// Regional endpoint via kb.path (preferred inside KB methods)
this.nuclia.rest.get<MyModel>(`${this.path}/something`);
//   kb.path       = '/kb/<id>'           (relative, works with zoneSlug on the Rest instance)
//   kb.fullpath   = 'https://europe-1.../v1/kb/<id>'  (absolute)
```

---

## Error Handling

### Search / Ask responses

`search()`, `find()`, `ask()`, `catalog()` **do not throw** — they return `IErrorResponse` inline:

```ts
interface IErrorResponse {
  type: 'error';
  status: number;
  detail: string;
  body?: any;
}
```

Always check before using results:

```ts
kb.search(query, [Search.Features.KEYWORD]).pipe(
  map((result) => {
    if (result.type === 'error') {
      console.error('Search failed', result.status, result.detail);
      return [];
    }
    return result.resources ?? [];
  }),
);
```

### REST errors (non-search)

Standard REST calls throw JavaScript errors with `{ status, detail }` properties. Handle with `catchError`:

```ts
this.sdk.nuclia.rest.get<MyData>('/some/path').pipe(
  catchError((err) => {
    if (err.status === 404) return of(null);
    return throwError(() => err);
  }),
);
```

### 429 (rate limiting)

The SDK exports `retry429Config` for use in pipes:

```ts
import { retry429Config } from '@nuclia/core';
this.nuclia.rest.get<Data>('/path').pipe(retry(retry429Config));
```

---

## Angular Integration (`@flaps/core`)

### `SDKService` — the central Angular wrapper

`SDKService` (`libs/core/src/lib/api/sdk.service.ts`) is **the single Angular gateway** to the SDK. It:

- Holds the `Nuclia` instance: `sdk.nuclia`
- Exposes reactive streams: `sdk.currentKb`, `sdk.currentArag`, `sdk.currentAccount`, `sdk.kbList`, `sdk.aragList`
- Manages account/KB/ARAG lifecycle (sets `zone`, refreshes lists, wraps in `WritableKnowledgeBox`)

**Always inject `SDKService` in Angular services — never instantiate `new Nuclia(...)` yourself.**

### Patterns for new Angular services

#### Simple global-endpoint service

```ts
// libs/core/src/lib/api/my-feature.service.ts
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { SDKService } from './sdk.service';
import { MyModel } from '@nuclia/core';

@Injectable({ providedIn: 'root' })
export class MyFeatureService {
  private sdk = inject(SDKService);

  getThings(): Observable<MyModel[]> {
    return this.sdk.nuclia.rest.get<MyModel[]>('/my-endpoint');
  }

  createThing(data: Partial<MyModel>): Observable<MyModel> {
    return this.sdk.nuclia.rest.post<MyModel>('/my-endpoint', data);
  }
}
```

#### KB-level service (requires current KB context)

```ts
import { Injectable, inject } from '@angular/core';
import { switchMap, Observable } from 'rxjs';
import { SDKService } from '@flaps/core';
import { MyKbModel } from '@nuclia/core';

@Injectable({ providedIn: 'root' })
export class MyKbFeatureService {
  private sdk = inject(SDKService);

  // Good: react to the current KB observable
  getStuff(): Observable<MyKbModel> {
    return this.sdk.currentKb.pipe(
      switchMap((kb) => kb.nuclia.rest.get<MyKbModel>(`${kb.path}/my-kb-endpoint`, undefined, false, kb.zone)),
    );
  }
}
```

> **Why `switchMap` on `currentKb`?** The user may switch KBs at runtime. Chaining off
> `currentKb` automatically cancels in-flight requests when the KB changes.

### Where to add the call

| Operation type                                   | Where to add                                          |
| ------------------------------------------------ | ----------------------------------------------------- |
| New KB read operation used in multiple apps      | `KnowledgeBox` in `libs/sdk-core/src/lib/db/kb/kb.ts` |
| New KB write operation                           | `WritableKnowledgeBox` in same file                   |
| New account/global operation needed in the SDK   | `Db` in `libs/sdk-core/src/lib/db/db.ts`              |
| App-specific or composed endpoint (Angular-only) | New/existing service in `libs/core/src/lib/api/`      |
| One-off call inside a component (avoid)          | Prefer a service; only inline if truly trivial        |

---

## Adding a New SDK Endpoint (Step-by-Step)

1. **Define the model** in `kb.models.ts` (or `db.models.ts` for global models) and export it.
2. **Add the method** to `KnowledgeBox` or `WritableKnowledgeBox` (or `Db`). Use `this.nuclia.rest.*`.
3. **Re-export** the model from `libs/sdk-core/src/index.ts` if it needs to be public (it re-exports everything via `export * from './lib/db'` already).
4. **Write the Angular service** in `libs/core/src/lib/api/` consuming the new SDK method via `SDKService`.
5. **Export** the service from `libs/core/src/lib/api/index.ts`.

### Minimal example — adding a "Get Search Config" endpoint

```ts
// Step 1: model — kb.models.ts already has SearchConfig, skip
// Step 2: method inside KnowledgeBox
getSearchConfig(): Observable<SearchConfig> {
  return this.nuclia.rest.get<SearchConfig>(`${this.path}/search-configs/default`);
}

// Step 4: Angular service
@Injectable({ providedIn: 'root' })
export class SearchConfigService {
  private sdk = inject(SDKService);

  getConfig(): Observable<SearchConfig> {
    return this.sdk.currentKb.pipe(switchMap((kb) => kb.getSearchConfig()));
  }
}
```

---

## `as const` Show Field Pattern

SDK model files (e.g., `activity.models.ts`) define show/field sets as `as const` arrays with
derived union types:

```ts
// In the SDK model file
export const ACTIVITY_SHOW_FIELDS = ['date', 'user', 'action', 'resource'] as const;
export type ActivityShowField = (typeof ACTIVITY_SHOW_FIELDS)[number];
```

**Consumer code should import the SDK arrays and filter — never re-enumerate the values:**

```ts
// ✅ Correct: filter the SDK source-of-truth array
const EXCLUDED: ActivityShowField[] = ['user'];
const MY_FIELDS = ACTIVITY_SHOW_FIELDS.filter((f) => !EXCLUDED.includes(f));

// ❌ Wrong: re-listing values that already exist in the SDK
const MY_FIELDS = ['date', 'action', 'resource']; // drifts when SDK adds new fields
```

This ensures consumers automatically pick up new fields added to the SDK without code changes.

---

## Common Mistakes to Avoid

| Mistake                                                    | Correct pattern                                                 |
| ---------------------------------------------------------- | --------------------------------------------------------------- |
| `new Nuclia(...)` inside a component or service            | Inject `SDKService`; use `this.sdk.nuclia`                      |
| `firstValueFrom(...)` for a call that should stay reactive | Use `Observable` and subscribe/pipe normally                    |
| Forgetting `zoneSlug` on regional endpoints                | Use `kb.path` inside KB methods, or pass `zoneSlug` to `rest.*` |
| Not checking `result.type === 'error'` on search results   | Always guard search/ask responses                               |
| Adding a raw `fetch()` call bypassing the SDK              | Use `sdk.nuclia.rest.*` instead                                 |
| Importing `@nuclia/core` models from a relative path       | Always import from the `@nuclia/core` alias                     |
| Subscribing in a service without unsubscribing             | Use `takeUntilDestroyed()` or delegate to `SDKService` streams  |
