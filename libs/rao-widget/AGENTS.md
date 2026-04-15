# AGENTS.md — `libs/rao-widget`

## Library Overview

`rao-widget` is a self-contained **embeddable web component** (`<progress-rao-widget>`) built with React 18 + Web Components API. Provides an AI-powered conversational assistant (Agentic RAG) for embedding in external sites. Shadow DOM isolates styles. Communication: WebSocket (chat streaming) + HTTP (session management).

**Two build configs** (non-obvious — choosing wrong one breaks embed):
| Config | Entry | Output | Use case |
|---|---|---|---|
| `vite.config.lib.ts` (primary `build` target) | `src/index.ts` | `rao-widget.umd.js` | Single `<script>` drop-in; React + `@nuclia/core` **bundled in** |
| `vite.config.ts` (ESM) | `src/index.tsx` | `rao-widget.es.js` | NPM consumption; React **externalized** |

Run `nx build rao-widget` → executes UMD build.

---

## Project Structure

```
libs/rao-widget/src/
├── index.ts              # Registers <progress-rao-widget> custom element
├── web-component.tsx     # HTMLElement subclass; reads attrs → mounts React into Shadow DOM
├── RaoWrapper.tsx        # Validates required attrs; builds Nuclia instance; loads SVG sprite
├── RaoApp.tsx            # RaoProvider + RaoWidget composition (sessionId="ephemeral" always)
├── interfaces/           # INuclia, IMessage, ISession, IResources (DEFAULT_RESOURCES), ICallState<T>
├── hooks/
│   ├── RaoProvider.tsx   # Core state: auth (ephemeral JWT), WebSocket chat, conversation, sessions
│   └── RaoContext.ts     # React context + useRaoContext hook
├── repository/
│   ├── auth.ts           # createAuthApi() factory — ephemeral JWT token endpoint; supports service-account header override
│   ├── chat.ts           # ChatRepository factory — WebSocket ARAG chat; ChatHandlers, ChatConnectOptions, ChatConnection interfaces
│   └── sessions.ts       # Catalog API — list/get/create sessions
└── components/
    ├── Icon/             # SVG sprite <use> icon (sm|md|lg)
    ├── Conversation/     # Message thread (markdown, sources, reasoning)
    ├── SessionDrawer/    # Slide-out session history drawer
    └── RaoWidget/
        ├── Standard/     # Full chat UI: prompt cards, input, voice, drawer trigger
        └── Floating/     # Circular launcher button + dialog panel overlay
```

---

## Custom Element API

**Tag:** `<progress-rao-widget>`  
Attribute names are kebab-case; normalized to camelCase before passing to React.

### Required attributes

| Attribute            | Description                                                        |
| -------------------- | ------------------------------------------------------------------ |
| `account`            | Progress/Nuclia account ID                                         |
| `zone`               | Deployment zone (e.g., `europe-1`) — prepended to backend hostname |
| `aragid` (or `arag`) | Knowledge Box / Retrieval Agent UUID                               |

### Key optional attributes

| Attribute         | Default                          | Description                                                                |
| ----------------- | -------------------------------- | -------------------------------------------------------------------------- |
| `backend`         | `https://rag.progress.cloud/api` | Base HTTP endpoint; zone prefix auto-injected                              |
| `apikey`          | —                                | Bearer key; falls back to `localStorage.getItem('JWT_KEY')`                |
| `viewtype`        | `"conversation"`                 | `"conversation"` = inline Standard view; `"floating"` = launcher + overlay |
| `promptconfig`    | —                                | JSON: `{"prompts":["…"],"usefallbackprompts":false,"visibleprompts":4}`    |
| `recordingconfig` | —                                | JSON: `{"language":"en-US"}` — enables microphone button                   |
| `resources`       | `DEFAULT_RESOURCES`              | JSON partial override of all UI text labels (see `IResources`)             |

---

## Key Components

- **`RaoProvider`** — central state machine: obtains ephemeral JWTs, manages WebSocket chat, parses `AragAnswer` streaming frames, accumulates `IMessage[]` conversation.
- **`Standard`** — full chat UI with prompt cards (intro), textarea, voice recorder, session-history drawer.
- **`Floating`** — circular launcher button; on click mounts `Standard` inside a `role="dialog"` panel. Escape key closes.

---

## Run Commands

```bash
nx build rao-widget   # UMD build → dist/rao-widget/rao-widget.umd.js
nx test rao-widget    # Vitest
nx lint rao-widget
```

---

## Important Conventions

1. **No `attributeChangedCallback`** — attributes are read once on `connectedCallback`. To update props after mount, remove and re-insert the element.
2. **Shadow DOM + inline CSS** — all CSS imported as `?inline` strings and injected via `<style>` tags in the Shadow DOM. No separate CSS output; no style leakage.
3. **Ephemeral sessions always** — `sessionId="ephemeral"` is hardcoded in `RaoApp.tsx`. Persistent sessions exist in `SessionsApi` but are not yet wired to chat flow (guarded by `features.sessionHistory = false`).
4. **`@nuclia/core` aliasing** — `vite.config.lib.ts` aliases `@nuclia/core` → `libs/sdk-core/src/index.ts`. UMD bundle uses workspace SDK. Keep in sync with published package.
5. **Two build configs** — `nx build rao-widget` runs UMD (`vite.config.lib.ts`). ESM build uses `vite.config.ts`. Don't confuse them.
6. **`version` token** — wrapper div has `data-version="__NUCLIA_DEV_VERSION__"`. This placeholder is replaced at build/release time.
7. **Kebab-case attrs, camelCase props** — `web-component.tsx` converts `api-key` → `apiKey` via regex. Always define React props camelCase, HTML attrs kebab-case.
8. **i18n via `resources` attr** — all text sourced from `IResources` (default English in `src/interfaces/const.ts`). Pass partial JSON as `resources` attribute to override labels.
9. **Repository factory pattern** — `auth.ts` exports `createAuthApi(fetcher, accountId, knowledgeBoxId, config?)` returning `{ createEphemeralToken }`. `chat.ts` exports `ChatRepository` interface with `connect(options)` and `buildSocketUrl(...)`. Both are factory functions, not classes — instantiate per-component in `RaoProvider`.
