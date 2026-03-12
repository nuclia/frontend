# AGENTS.md — `libs/search-widget` (`@nuclia/widget`)

> **Nx project:** `search-widget` | **Package:** `@nuclia/widget` v1.2.0 | MIT

## Overview

Svelte-based embeddable search-and-chat library for Nuclia. Ships as:
1. **Web components** (custom elements) — drop a `<script>` tag, zero framework dependency.
2. **Svelte component imports** — via `@nuclia/widget` in a Svelte app.

Connects to a NucliaDB Knowledge Box (KB) and provides: hybrid search, generative AI answers (RAG), file/media viewer, knowledge-graph, popup/floating-chat/global-search UIs, and experimental agentic RAG (ARAG).

---

## Tech Stack

| Layer | Technology |
|---|---|
| UI framework | **Svelte 3** (peer dep); **Svelte 5 runes** used only in `arag-state.svelte.ts` |
| Build | Vite + `@sveltejs/vite-plugin-svelte` + `svelte-preprocess` |
| State | RxJS 7 `BehaviorSubject` via custom `SvelteState` / `writableSubject` wrappers |
| SDK | `@nuclia/core` (peer dep) |
| Test | Vitest + jsdom |

---

## Project Structure

```
libs/search-widget/src/
├── index.js            # public entry — re-exports core, common, components, widgets
├── core/
│   ├── api.ts          # Nuclia SDK init + all API calls (single module, not a class)
│   ├── i18n.ts         # lazy i18n — fetches JSON from CDN; exposes `_` observable + translateInstant()
│   ├── models.ts       # shared TS types (TypedResult, WidgetOptions, etc.)
│   ├── reset.ts        # shared `reset` Subject (breaks circular deps between stores)
│   ├── search-bar.ts   # setupTriggerSearch() — main RxJS search pipeline
│   ├── tracking.ts     # PostHog integration (disabled on localhost)
│   ├── state-lib/
│   │   ├── state.lib.ts        # SvelteState<STATE> — typed flux store factory
│   │   └── writable-subject.ts # writableSubject / SvelteWritableSubject
│   └── stores/
│       ├── answers.store.ts    # answerState — chat history, streaming, TTS
│       ├── arag-state.svelte.ts # aragAnswerState — Svelte 5 $state (NOT SvelteState)
│       ├── effects.ts          # ALL reactive subscriptions (search, ask, viewer, i18n...)
│       ├── search.store.ts     # searchState — query, filters, results, pagination
│       ├── viewer.store.ts     # viewerState — open resource/field, transcripts
│       └── widget.store.ts     # widgetFeatures, feature-flag observables (~30)
├── common/             # low-level UI primitives (no Nuclia business logic)
└── widgets/            # web component + Svelte export entry points
    ├── index.ts        # named Svelte exports: NucliaSearchBar, NucliaChat, ...
    ├── search-widget/  # nuclia-search-bar + nuclia-search-results
    ├── chat-widget/    # nuclia-chat
    ├── floating-chat-widget/ # nuclia-floating-chat + FAB
    ├── popup-widget/   # nuclia-popup
    ├── viewer-widget/  # nuclia-viewer
    ├── global-widget/  # nuclia-global-search
    └── arag-widget/    # nuclia-arag-widget (EXPERIMENTAL, separate build bundle)
```

---

## Web Components — HTML Tags & JS APIs

All web components use `customElement: true`. The `state` HTML attribute maps to the internal `kbstate` prop.

| Component | HTML tag | Notes |
|---|---|---|
| `SearchBar` | `<nuclia-search-bar>` | **Config hub** — must always be present. Owns `initNuclia()` lifecycle. |
| `SearchResults` | `<nuclia-search-results>` | No required props — reads state from shared stores. |
| `ChatWidget` | `<nuclia-chat>` | Standalone inline/fullscreen chat. |
| `FloatingChatWidget` | `<nuclia-floating-chat>` | Chat in a FAB panel. |
| `PopupWidget` | `<nuclia-popup>` | SearchBar + SearchResults inside a modal overlay. |
| `ViewerWidget` | `<nuclia-viewer>` | Standalone resource viewer (open by `rid`/`field_id`/`field_type` props). |
| `GlobalWidget` | `<nuclia-global-search>` | Full-page infinite scroll search (no chat, no viewer). |
| `AragWidget` | `<nuclia-arag-widget>` | EXPERIMENTAL — requires `arag` prop instead of `knowledgebox`. |

**Programmatic JS APIs** (all custom elements):
- `await el.onReady()` — Promise resolving after `initNuclia()` completes
- `el.onError()` — `Observable<IErrorResponse>` for error surfacing
- `el.reset()` — tears down Nuclia instance and cleans all subscriptions

**Chat-specific** (`nuclia-chat`, `nuclia-floating-chat`):
- `el.openChat()` / `el.closeChat()`
- `el.ask(query, reset?, inputOnly?)` — `reset=false` appends; `inputOnly=true` sets input without triggering search
- `el.setInitHook((nucliaInstance) => {})` — called after Nuclia init

**Viewer-specific** (`nuclia-viewer`):
- `el.openPreview({ resourceId, field_id, field_type })` → `Observable<boolean>`
- `el.setViewerMenu([{ label, action }])` — custom context menu items

**Global-specific** (`nuclia-global-search`):
- `el.search(query, inputOnly?)` / `el.reloadSearch()`

---

## Svelte Component Imports

```typescript
import {
  NucliaSearchBar, NucliaSearchResults, NucliaChat,
  NucliaGlobalSearch, NucliaViewerWidget, NucliaAragWidget,
} from '@nuclia/widget';
// stores and services also importable:
import { searchQuery, triggerSearch, widgetFeatures } from '@nuclia/widget';
```

---

## State Management

### Primitives

**`writableSubject<T>(initialValue)`** (`state-lib/writable-subject.ts`)
Extends `BehaviorSubject<T>` adding `.set(v)` and `.update(fn)` to match the Svelte writable store contract.

**`SvelteState<STATE>`** (`state-lib/state.lib.ts`)
Typed flux store backed by a single `BehaviorSubject<STATE>`:
- `.reader<U>(selectFn)` → `ReadableObservable<U>` (has `.getValue()`)
- `.writer<U, V>(selectFn, updateFn)` → `SvelteWritableObservable<U, V>` (adds `.set(v)`)
- `.action(updateFn)` → `SvelteActionObservable` (adds `.do()`)
- `.reset()` → restores initial state

### Key stores (all in `src/core/stores/`)
| Store | Exports |
|---|---|
| `search.store.ts` | `searchState`, `searchQuery`, `searchResults`, `triggerSearch`, `showResults`, `pageNumber` |
| `answers.store.ts` | `answerState`, `chat`, `currentAnswer`, `isStreaming`, `resetChat` |
| `viewer.store.ts` | `viewerState`, `viewerData`, `isPreviewing`, `viewerOpened`, `viewerClosed` |
| `widget.store.ts` | `widgetFeatures`, `widgetFilters`, + ~30 feature-flag derived observables |
| `arag-state.svelte.ts` | `aragAnswerState` — **Svelte 5 `$state` rune, not RxJS** |

### Effects (`effects.ts`)
All cross-store subscriptions live exclusively here — torn down via the `reset` Subject. Components and stores never subscribe to each other directly.

---

## Services (`src/core/api.ts`)

All API calls and SDK lifecycle in a single module (not a class):
- `initNuclia(options, state, widgetOptions, noTracking?)` — creates the singleton Nuclia SDK instance
- `resetNuclia()` — destroys instance; emits on `reset` Subject to tear down all subscriptions
- `find()`, `getAnswer()`, `suggest()` — thin wrappers over `@nuclia/core` KB methods
- `getApiErrors()` — `Observable<IErrorResponse>` for widget error surfacing

**`setupTriggerSearch(dispatch)`** (`search-bar.ts`):
Main RxJS pipeline: `triggerSearch Subject` → debounce → `forkJoin` filters/options → `find()` + optional `getAnswer()` → write to stores → Svelte `dispatch` events.

---

## Build & Nx Targets

```bash
nx build search-widget         # tools/build-widgets.sh (3 Vite passes)
nx test search-widget          # vitest --run
nx lint search-widget
nx check search-widget         # svelte-check
```

**3 output bundles** in `dist/libs/search-widget/`:
- `nuclia-widget.umd.js` / `.mjs` — main bundle (search-bar, results, chat, popup, viewer, floating-chat)
- `nuclia-global-widget.umd.js` / `.mjs` — full-page global search
- `nuclia-arag-widget.umd.js` / `.mjs` — ARAG experimental widget

`nuclia-video-widget`, `nuclia-chat-widget`, `nuclia-popup-widget`, `nuclia-viewer-widget` are **identical copies** of the main bundle for backward compatibility.

---

## Conventions & Gotchas

1. **Singleton.** `initNuclia()` enforces one instance per page — a second call destroys the first. Use iframes for multiple KB connections.

2. **`kbstate` / `state` attribute.** The HTML attribute `state` maps to the internal prop `kbstate` via `<svelte:options customElement={{ props: { ... } }}>`. Required for Svelte custom element prop aliasing.

3. **`SvelteState` pattern everywhere except ARAG.** `arag-state.svelte.ts` uses Svelte 5 `$state` rune intentionally — do not wrap it in `SvelteState`.

4. **Feature flags are additive.** Unknown flags are silently ignored. Never use flags for security — they are purely UI toggles. Key mutual exclusions that **throw at `initNuclia` time:**
   - `semanticOnly` and `useSynonyms` are both mutually exclusive with `relations`

5. **CDN immutability.** Set the `cdn` attribute before mount. Do not change it after `onReady()` — all asset paths (`i18n`, fonts, SVG sprite) are computed once at init.

6. **`accessors` directive.** All web component widgets declare `accessors` in `<svelte:options>`, exposing every exported function (`onReady`, `reset`, `ask`, etc.) as direct DOM element properties.

7. **i18n fallback.** Missing key in requested locale → falls back to `en`. Missing in `en` → renders raw key.

8. **Testing.** `*.spec.ts` co-located in `src/**`. Vitest + jsdom. `@nuclia/core` resolved from source via Vite alias — no mocking needed for SDK types.
