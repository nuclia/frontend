# AGENTS.md — `libs/sdk-core` (`@nuclia/core`)

## Overview

`libs/sdk-core` is the **Nuclia JavaScript/TypeScript SDK** — the single source of truth for all Nuclia backend communication.

- **npm package:** `@nuclia/core` (v1.31.1, MIT)
- **Internal alias:** `@nuclia/core → libs/sdk-core/src/index.ts` (no build step needed for workspace consumers)
- **Framework-agnostic** — no Angular/React/DOM dependency; works in browser, Node.js (with polyfills), and as UMD bundle
- **Observable-first** — every async operation returns `Observable<T>`. `asyncKnowledgeBox` proxy wraps them as Promises when needed.

Capabilities: authenticated HTTP client, account/KB/agent management, search/RAG, agentic pipelines, resource lifecycle.

---

## Project Structure

```
libs/sdk-core/
├── package.json            # peer dep: rxjs ^7.8.0
├── rollup.config.mjs       # dual output: ESM (esm/) + UMD (umd/); types in types/
└── src/
    ├── index.ts            # barrel: re-exports auth, core, db, models, rest
    └── lib/
        ├── core.ts         # Nuclia class — library entry point
        ├── models.ts       # INuclia, IAuthentication, IRest, IDb, NucliaOptions, IErrorResponse, PromiseMapper
        ├── events.ts       # Events class — lightweight pub/sub & debug logging
        ├── auth/
        │   ├── auth.ts          # Authentication (JWT + API-key + standalone); REFRESH_DELAY = 6 hours
        │   ├── auth.models.ts   # AuthTokens, NucliaDBRole, AuthInfo
        │   └── jwt-helpers.ts   # JwtHelper (base64 decode), JwtUser interface
        ├── rest/
        │   └── rest.ts          # Rest class — thin HTTP layer (fetch + streaming)
        └── db/
            ├── db.ts            # Db class — accounts, KBs, agents, NUA clients
            ├── db.models.ts     # Account, AccountTypes, LearningConfigurations…
            ├── upload.ts        # upload() / batchUpload() with TUS support
            ├── kb/
            │   ├── kb.ts            # KnowledgeBox (read) + WritableKnowledgeBox (write)
            │   ├── kb.models.ts     # IKnowledgeBoxBase, KBRoles, LabelSet, SearchConfig…
            │   └── activity/
            │       ├── activity-monitor.ts  # ActivityMonitor — download + queryActivityLogs()
            │       ├── activity.models.ts   # ActivityLogItem, EventType, RemiQueryCriteria…
            │       └── index.ts
            ├── search/
            │   ├── search.ts        # find(), search(), catalog(), suggest()
            │   ├── search.models.ts # Search namespace, SearchOptions, filters
            │   ├── ask.ts           # ask() — SSE streaming → assembled Ask.Answer
            │   └── ask.models.ts    # Ask namespace (Answer, Features, AskResponseItem)
            ├── resource/
            │   ├── resource.ts         # ReadableResource + Resource classes
            │   ├── resource.models.ts  # IResource, FIELD_TYPE, Relation…
            │   └── resource.helpers.ts # retry429Config, setLabels, sliceUnicode
            ├── retrieval-agent/
            │   ├── retrieval-agent.ts        # RetrievalAgent (extends WritableKnowledgeBox)
            │   ├── retrieval-agent.models.ts # SessionList, AragAnswer, PreprocessAgent…
            │   ├── retrieval-agent.types.ts  # AragModule, ProviderType, type guards
            │   ├── memory.models.ts          # Memory namespace — NucliaDBMemoryConfig, MemoryConfig, Rule, Rules…
            │   ├── interactions.models.ts    # InteractionOperation, AnswerOperation, AragAnswer, InteractionRequest
            │   └── driver.models.ts          # IDriver, DriverCreation, and driver config types (BraveConfig, CypherConfig, NucliaDBConfig, McpSseConfig…)
            ├── notifications/
            │   └── notifications.ts  # getAllNotifications() — SSE stream
            ├── sync/
            │   └── sync.ts           # SyncManager class
            └── task/
                └── task.ts           # TaskManager class
```

---

## Class Hierarchy

```
Nuclia
 └── .db (Db)
      └── getKnowledgeBox() → WritableKnowledgeBox
           └── getRetrievalAgent() → RetrievalAgent
 └── .knowledgeBox (read-only KnowledgeBox — no auth needed for public KBs)
```

**Key distinction:** `nuclia.knowledgeBox` → read-only, public access. `db.getKnowledgeBox()` → writable, requires account auth.
`RetrievalAgent` inherits all `WritableKnowledgeBox` methods but routes to `/agent/{id}` endpoints.

---

## Important Conventions

### Observable-first

All async operations return `Observable<T>`, never `Promise<T>`.

```ts
// Correct
nuclia.knowledgeBox.find('query').subscribe(result => { ... });
// Promise-based consumers
const result = await nuclia.asyncKnowledgeBox.find('query');
```

### Error response discrimination

Search/ask never throw — they return `IErrorResponse` as a valid emission:

```ts
kb.ask('question')
  .pipe(filter((r) => r.type !== 'error'))
  .subscribe((answer) => console.log(answer.text));
```

### Streaming `ask()`

`ask()` emits multiple chunks as the LLM generates. The last emission has `incomplete: false`. Use `filter(r => !r.incomplete)` to get only the final assembled answer.

### `synchronous` write operations

POST/PUT/PATCH/DELETE default to async (backend queues). Pass `synchronous: true` to wait for completion:

```ts
kb.createResource(data, true).subscribe(() => console.log('fully created'));
```

### Authentication modes

| Mode                | Setup                           | Header                                                                    |
| ------------------- | ------------------------------- | ------------------------------------------------------------------------- |
| Public KB           | `public: true` in options       | None                                                                      |
| Service account     | `apiKey: '<key>'`               | `X-NUCLIA-SERVICEACCOUNT: Bearer <key>`                                   |
| User JWT            | `nuclia.auth.login(user, pass)` | `Authorization: Bearer <jwt>`                                             |
| Standalone NucliaDB | `standalone: true`              | `X-NUCLIADB-ROLES: READER/WRITER/MANAGER` (auto-derived from method+path) |

### TUS uploads

Files over 5 MB use TUS resumable upload protocol. Pass `TUS: true` to `upload()` / `batchUpload()`.

### Custom headers

```ts
new Nuclia({ ...options, modifyHeaders: (h) => ({ ...h, 'X-Custom': 'value' }) });
```

### Events bus for debugging

```ts
nuclia.events.on('api-error').subscribe(console.error);
nuclia.events.dump().subscribe((logs) => console.log(logs.lastQuery));
```

Standard events emitted: `api-error`, `partial`, `lastQuery`, `lastResults`.

### Agentic RAG pipelines

`createAgenticRAGPipeline(steps)` builds a declarative state machine. Steps use `{{variableName}}` template interpolation to reference previous step outputs. Run with `pipeline.run({ query }).subscribe(...)`.

### Activity log live query

`ActivityMonitor.queryActivityLogs(eventType, query)` is the SDK-level pagination API for the metrics pages. The endpoint returns NDJSON — `rest.post(..., doNotParse=true)` receives the raw `Response`, then text body is split by newlines and JSON-parsed. **Do not** use the download-based methods for UI display — they produce CSV/NDJSON files for download, not structured data.

`EventType` values: `NEW`, `MODIFIED`, `PROCESSED`, `CHAT`, `ASK`, `SEARCH`, `SUGGEST`, `INDEXED`, `RETRIEVE`, `AUGMENT`.---

## How Workspace Apps Use This Library

```ts
import { Nuclia } from '@nuclia/core';
import { Search, Ask, ChatOptions, IErrorResponse } from '@nuclia/core';
import { IResource, FIELD_TYPE, ResourceProperties } from '@nuclia/core';
import { AccountBlockingState, KBRoles } from '@nuclia/core';
```

| Consumer                     | Primary usage                               |
| ---------------------------- | ------------------------------------------- |
| `apps/dashboard`             | Full account + KB management, search        |
| `apps/manager-v2`            | Account admin, model management             |
| `apps/rao` / `apps/rao-demo` | KB search, ask, find                        |
| `libs/search-widget`         | `KnowledgeBox.ask()`, `find()`, `suggest()` |
| `libs/rao-widget`            | `RetrievalAgent.interact()`                 |
| `libs/core` (Angular)        | `SDKService` wraps the `Nuclia` instance    |

---

## Build & Test

```bash
nx build sdk-core        # rollup → dist/sdk-core/ (ESM + UMD)
nx test sdk-core         # Jest, jsdom environment
nx test sdk-core --watch
```

Tests are co-located as `*.spec.ts` files alongside source in `src/lib/`.
