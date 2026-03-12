---
name: error-handling
description: >
  Error handling patterns for the Nuclia frontend monorepo — covering IErrorResponse
  discrimination, SisToastService usage, catchError categories (rethrow / convert / swallow),
  the retry429Config and uploadRetryConfig helpers, the AuthInterceptor contract, error state
  in Svelte search-widget stores, and error handling in the React rao-widget. Activate this
  skill ANY TIME a task involves catchError, handling SDK responses, showing error toasts,
  writing error callbacks in subscriptions, defining retry logic, or surfacing errors in the UI.
  Do not wait to be asked about "error handling" specifically — if a service is calling the SDK
  and there is no error path, or if an error toast is being triggered with a raw string, this
  skill applies immediately.
---

# Error Handling — Nuclia Frontend Monorepo

Errors in this codebase come from two different SDK contracts depending on which method is
called. Getting these mixed up is the most common error-handling mistake.

---

## Non-Negotiable Rules

1. **Search/ask/find/catalog never throw — they return `IErrorResponse`.** Always discriminate
   on `result.type === 'error'` after these calls. If you skip this check, errors are silently
   rendered as empty results.
2. **Always pass i18n keys to `SisToastService`, never raw strings.** `toaster.error('upload.toast.blocked')`,
   not `toaster.error('Upload blocked')`.
3. **Do not handle 400/401 in components or services.** The `AuthInterceptor` already handles
   these by logging out and redirecting. Re-handling them causes double-logout bugs.
4. **Do not invent custom retry logic.** Use `retry429Config()` for rate-limited API calls and
   `uploadRetryConfig` for uploads. Both are defined in `libs/sdk-core`.
5. **`shareReplay(1)` must come after `catchError`**, not before. If `catchError` is missing and
   the pipeline errors, `shareReplay` will replay the error to every future subscriber.

---

## IErrorResponse — Shape and Contract

Defined in `libs/sdk-core/src/lib/models.ts`:

```ts
export interface IErrorResponse {
  status: number;   // HTTP status, or -1 / -2 / -3 for SDK-specific sentinels
  detail: string;
  type: 'error';
  body?: any;       // parsed JSON response body (when available)
}
```

**Negative status sentinels** (search/ask only):

| Status | Meaning |
|--------|---------|
| `-1` | LLM error (generation failed) |
| `-2` | LLM cannot answer (not enough data) |
| `-3` | No retrieval data found |
| `402` | Feature blocked by subscription |
| `412` | Rephrasing error |
| `529` | Service overloaded |

---

## Two SDK Error Contracts

### Contract A — Search / Ask / Find / Catalog

These methods **return** `Observable<T | IErrorResponse>`. They never throw.

```ts
this.kb.search(query).subscribe((result) => {
  if (result.type === 'error') {
    this.toaster.error(this.getSearchErrorKey(result.status));
    return;
  }
  // result is now safely typed as SearchResults
  this.results.set(result);
});

private getSearchErrorKey(status: number): string {
  const map: Record<string, string> = {
    '-3': 'answer.error.no_retrieval_data',
    '-2': 'answer.error.llm_cannot_answer',
    '-1': 'answer.error.llm_error',
    '402': 'answer.error.feature-blocked',
    '529': 'answer.error.service-overloaded',
  };
  return map[String(status)] ?? 'error.generic';
}
```

### Contract B — All other SDK methods (CRUD, management)

These methods **throw** a plain object `{ status: number, body: any }` — **not** an `Error`
instance. Catch with `catchError`:

```ts
this.kb.getResource(id).pipe(
  catchError((err) => {
    this.toaster.error('kb.resource.load.error');
    return EMPTY;   // or throwError(() => err) if callers need to handle it
  }),
).subscribe((resource) => {
  this.resource.set(resource);
});
```

**Important:** `err.status` is the HTTP status code. `err.body` is the parsed response body.
There is no `.message` property — access `err.body?.detail` for a human-readable string.

---

## catchError Categories

There are three valid patterns. Choose based on whether the caller needs to know about the error:

### 1. Swallow + fallback value (non-critical, isolated failures)
```ts
// Used in db.ts zone loading — one zone failing shouldn't break the whole list
catchError(() => {
  console.error(`Unable to load KBs for zone: ${zone}`);
  return of([] as IKnowledgeBoxItem[]);
})
```
Use when: a failed sub-request would cause a blank UI that is worse than partial data.

### 2. Convert to typed result (upload / search pipelines)
```ts
// Used in upload.ts — callers inspect .failed, .limitExceeded etc.
catchError((error) =>
  of({ failed: true, limitExceeded: error.status === 429, blocked: error.status === 402 })
)
```
Use when: callers need to branch on what kind of error occurred.

### 3. Rethrow (service boundary, let the component decide)
```ts
catchError((err) => {
  if (err.status === 409 && data.client_id) return this.renewNUAClient(...);  // recover
  return throwError(() => err);   // propagate everything else
})
```
Use when: the service cannot determine the right UX response and the caller can.

---

## SisToastService — Showing Error Toasts

```ts
import { SisToastService } from '@nuclia/sistema';

private toaster = inject(SisToastService);

// In error callbacks:
this.someService.save().pipe(
  catchError(() => {
    this.toaster.error('kb.save.error');   // always an i18n key
    return EMPTY;
  }),
).subscribe();
```

Available methods: `info(key)`, `success(key)`, `warning(key)`, `error(key)`.

`warning()` and `error()` include a close button automatically.

---

## Retry Logic — Use the Existing Helpers

Both helpers live in `libs/sdk-core/src/lib/db/resource/resource.helpers.ts`:

```ts
import { retry429Config, uploadRetryConfig } from '@nuclia/core';

// Rate-limited API calls (respect Retry-After header):
this.kb.listResources().pipe(
  retry(retry429Config()),          // 3 retries, only on 429, respects body.detail.try_after
)

// Uploads (retry on 5xx):
uploadPipeline$.pipe(
  retry(retry429Config(maxWait)),   // 429 first
  retry(uploadRetryConfig),         // 5xx second (immediate, 3 retries)
)
```

`retry429Config(maxWaitOn429 = 30000)` — delays `[1s, 5s, 10s]` unless a `try_after`
timestamp is present in the response body.

Do **not** write `retry({ count: 3 })` directly — it has no delay and no status filter.

---

## AuthInterceptor Contract

`libs/common/src/lib/guards/auth.interceptor.ts` automatically:
- Catches **400 and 401** on requests to the Nuclia API origin
- Calls `sdk.nuclia.auth.logout()` and navigates to `/user/login`
- Re-throws the error so the pipeline still completes cleanly

**Do not write `if (err.status === 401)` logic in services or components.** This produces
a double-logout race condition. The interceptor handles it.

---

## search-widget (Svelte 5) — Error State Pattern

The widget stores error state in Svelte writable stores, not thrown exceptions:

```ts
import { chatError, searchError } from './stores/answers.store';

// After receiving IErrorResponse from SDK:
if (result.type === 'error') {
  chatError.set(result);
  // Map to i18n key for display:
  const key = errorStatusMap[String(result.status)] ?? 'answer.error.generic';
  appendErrorToChat(key);
  return;
}
```

In Svelte templates, error state is applied as a CSS class:
```svelte
<div class:error={!!$chatError}>
  {#if entry.error}
    <p class="error-message">{$_('answer.error.llm_error')}</p>
  {/if}
</div>
```

Widget-level errors (e.g., API auth failures) bubble up via `nuclia.events` as `'api-error'`
events. The parent app can subscribe: `getApiErrors()` in `AragWidget.svelte`.

---

## rao-widget (React 19) — Error Pattern

```ts
// In RaoProvider.tsx
function handleChatError(error: ChatError) {
  const detail =
    error.answer?.exception?.detail ??
    error.cause?.message ??
    error.message;
  finalizeAssistantMessage('Error', detail);  // appends an error turn to the chat
}

// WebSocket errors:
const handleError = (event: Event) => {
  dispatchError({ type: 'websocket', message: 'Chat websocket emitted an error event.', cause: event });
};
```

Typed `ChatError` objects are dispatched, never thrown. `dispatchError` feeds a React context
that renders an inline error state in the conversation.

---

## Common Mistakes

| Mistake | Correct approach |
|---------|-----------------|
| Not checking `result.type === 'error'` after `kb.search()` | Always discriminate on `type` for search/ask/find/catalog |
| `toaster.error('Upload failed')` | `toaster.error('upload.toast.blocked')` — always i18n key |
| `if (err.status === 401)` in a component | Don't — `AuthInterceptor` handles it |
| `retry({ count: 3 })` directly | Use `retry429Config()` or `uploadRetryConfig` |
| `err.message` on a thrown SDK error | `err.body?.detail` — plain objects, not `Error` instances |
| Placing `shareReplay(1)` before `catchError` | `catchError` must come before `shareReplay(1)` |
