# AGENTS.md — `libs/chrome-ext`

## Library Overview and Purpose

`chrome-ext` is a **Chrome browser extension** called **"Agentic RAG tools"** (v0.0.6). Its sole purpose is to let users upload web page content directly into a Nuclia Knowledge Box (KB) from any page in Chrome, without leaving the browser.

Key capabilities:
- Adds a **right-click context menu** entry ("Upload to Agentic RAG") on every HTTP/HTTPS page.
- Supports uploading with optional **label classification** by fetching KB labelsets dynamically and adding them as submenus.
- Replaces `<img>` relative URLs with **base64 data URIs** before uploading, so images are self-contained.
- Provides an **Options page** for OAuth login (via Nuclia dashboard redirect) and KB selection.
- Displays **Chrome notifications** on upload success or failure.

> This is **not** a reusable Angular/TypeScript library. It is a self-contained Chrome extension packaged as an Nx `library` project for build-tool convenience. No consuming app imports it as a module.

---

## Project Structure

```
libs/chrome-ext/
├── README.md                   # Quick-start instructions
├── jest.config.ts              # Jest configuration (ts-jest); no tests exist yet
├── project.json                # Nx project definition and build/test targets
├── tsconfig.spec.json          # TypeScript config scoped to spec/test files
└── src/
    └── lib/                    # All static extension source files copied verbatim to dist
        ├── manifest.json       # Chrome Extension Manifest v3 declaration
        ├── background.js       # Service worker: context menu, upload orchestration
        ├── api.js              # Shared helpers: SDK factory, settings, login URL, localStorage polyfill
        ├── style.css           # Shared CSS for the options page
        ├── logo.svg            # Nuclia/Agentic RAG logo used in the options page header
        ├── icons/
        │   ├── icon16.png      # Toolbar icon (16 × 16)
        │   ├── icon32.png      # Toolbar icon (32 × 32)
        │   ├── icon48.png      # Store / installer icon (48 × 48)
        │   ├── icon128.png     # Store / installer icon (128 × 128)
        │   └── error.png       # Icon shown in error notifications
        └── options/
            ├── options.html    # Options page markup (KB selection, login/welcome states)
            └── options.js      # Options page logic: auth flow, account/KB dropdowns, save
```

---

## Build Process

Defined in `project.json` under the `build` target (`nx:run-commands`), executed **sequentially**:

1. `mkdir -p dist/libs/chrome-ext/` — ensures output directory exists.
2. `rimraf dist/libs/chrome-ext/` — clears stale output.
3. `cp -a libs/chrome-ext/src/lib/ dist/libs/chrome-ext/` — copies all static extension files.
4. `mkdir -p dist/libs/chrome-ext/vendor/` — creates the vendor directory.
5. `cp dist/sdk-core/umd/index.js dist/libs/chrome-ext/vendor/nuclia-sdk.umd.min.js` — bundles the workspace `sdk-core` lib as a UMD vendor script.
6. `cp node_modules/rxjs/dist/bundles/rxjs.umd.min.js dist/libs/chrome-ext/vendor/rxjs.umd.min.js` — vendors RxJS as a UMD bundle.

After building, the loadable extension lives at **`dist/libs/chrome-ext/`**.

To build:
```bash
nx build chrome-ext
```

---

## Installation (Local / Development)

1. Run `nx build chrome-ext`.
2. Open Chrome and go to `chrome://extensions`.
3. Enable **Developer mode**.
4. Click **Load unpacked** and select `dist/libs/chrome-ext/`.
5. Open the extension's Options page to log in and configure a Knowledge Box.

Full instructions: [Chrome "Load unpacked" guide](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#load-unpacked).

---

## External Dependencies

| Dependency | How it arrives | Usage |
|---|---|---|
| `sdk-core` (workspace lib) | Built as `dist/sdk-core/umd/index.js`, copied to `vendor/nuclia-sdk.umd.min.js` | Provides `NucliaSDK.Nuclia` — the Nuclia API client class |
| `rxjs` (npm) | `node_modules/rxjs/dist/bundles/rxjs.umd.min.js`, copied to `vendor/rxjs.umd.min.js` | RxJS operators (`switchMap`, `map`, `tap`, `catchError`, `forkJoin`, `from`, `of`) used extensively in async flows |
| Chrome Extension APIs | Runtime APIs; no install needed | `chrome.storage`, `chrome.contextMenus`, `chrome.notifications`, `chrome.scripting`, `chrome.tabs`, `chrome.runtime` |

Both vendor bundles are loaded via `<script>` tags in `options.html` and via `importScripts()` in the service worker (`background.js`).

---

## Key Files, Functions, and Interfaces

### `api.js` — Shared Utilities

Loaded by both `background.js` (via `importScripts`) and `options.html` (via `<script>`).

| Symbol | Signature | Description |
|---|---|---|
| `API_URL` | `const string` | Base API URL: `https://rag.progress.cloud/api` |
| `DASHBOARD_URL` | `const string` | Dashboard URL: `https://rag.progress.cloud` |
| `SETTINGS` | `const object` | Default settings shape: `{ NUCLIA_ACCOUNT, NUCLIA_KB, NUCLIA_TOKEN, ZONE }` (all empty strings) |
| `localStorage` | polyfill | Overrides the global `localStorage` with an in-memory object because service workers do not support the real one |
| `getSDK(token, zone)` | `(string, string) → Nuclia` | Creates and authenticates a `NucliaSDK.Nuclia` instance. Sets `client: 'chrome_extension'` and `backend: API_URL`. Authentication uses `access_token` only (no token refresh). |
| `getLoginUrl()` | `() → string` | Builds the OAuth redirect URL: `${DASHBOARD_URL}/redirect?redirect=<options-page-url>&fromExtension=true` |
| `getStorage()` | `() → localStorage-like object` | Returns a plain-object-backed localStorage with `getItem`, `setItem`, `removeItem`, `clear` |
| `getSettings()` | `() → Promise<Settings>` | Reads `{ NUCLIA_ACCOUNT, NUCLIA_KB, NUCLIA_TOKEN, ZONE }` from `chrome.storage.local` |

---

### `background.js` — Service Worker

Entry point for the extension's background logic. Registered as `"service_worker": "background.js"` in the manifest.

**Event listeners registered at module level:**

| Event | Handler | Description |
|---|---|---|
| `chrome.runtime.onInstalled` | `createMenu()` | Rebuilds the context menu on first install or extension update |
| `chrome.runtime.onMessage` | checks `request.action === 'UPDATE_MENU'` | Re-runs `createMenu()` so the options page can trigger a menu refresh after saving settings |
| `chrome.contextMenus.onClicked` | upload flow | Reads settings → gets page HTML → uploads; redirects to options page if settings are missing |

**Functions:**

| Function | Signature | Description |
|---|---|---|
| `createMenu()` | `() → void` | Removes all existing context menus and recreates them. If settings are fully configured it also fetches labelsets and creates label submenus. |
| `createSubmenus(labelsets, type)` | `(Array, MenuType) → void` | Adds a nested "Upload with label…" parent menu entry, then one sub-item per labelset, and one leaf per label within each labelset. Menu IDs follow the pattern `NUCLIA_LABELSET_<type>_<key>_<label>`. |
| `getCurrentTabContent(tabId)` | `(number) → Promise<string>` | Uses `chrome.scripting.executeScript` to inject an expression that returns `document.documentElement.outerHTML`. |
| `getLabels(settings)` | `(Settings) → Observable<Array>` | Calls `sdk.db.getKnowledgeBox(…).pipe(switchMap(kb => kb.getLabels()))`, then sorts by key, filters to labelsets of kind `RESOURCES` (or unspecified kind), and filters out empty labelsets. |
| `uploadPage(settings, url, html, labels)` | `(Settings, string, string, Label[]) → void` | Calls `replaceImages` to inline images, then `createResource` to upload the page as `text/html`. On success shows a notification; on error opens the options page. |
| `createResource(settings, title, fileData, labels, mime)` | `(Settings, string, Blob, Label[], string) → Observable` | Gets the KB, creates a resource with `title` and label classifications, then uploads `fileData` as a file attachment. |
| `replaceImages(html, pageUrl)` | `(string, string) → Observable<string>` | Finds all `<img src="…">` tags, fetches each image URL (filtering to HTTP/HTTPS absolute URLs), converts them to base64 data URIs via `FileReader`, and substitutes them back into the HTML string. Errors per-image are silently swallowed. |
| `openOptionsPage()` | `() → void` | Opens `options/options.html?error=true` in a new tab. |
| `showNotification(title, message, error?)` | `(string, string, boolean) → void` | Creates a basic Chrome notification with `icon128.png` (or `error.png` if `error=true`). |

**Constants:**

| Constant | Value / Purpose |
|---|---|
| `MENU_LABELSET_PREFIX` | `"NUCLIA_LABELSET"` — prefix for labelset menu item IDs |
| `TITLE_REGEX` | Extracts `<title>` content from HTML |
| `IMG_REGEX` | Matches all `<img src="…">` URLs (global, case-insensitive) |
| `MENU_TYPES` | Array with one entry `{ name: 'PAGE', options: { contexts: ['page'], documentUrlPatterns: ['https://*/*', 'http://*/*'] } }` — easily extended for additional contexts |

---

### `options/options.js` — Options Page Logic

Runs in the context of `options.html`. All DOM interactions happen after `DOMContentLoaded`.

| Function | Signature | Description |
|---|---|---|
| `init()` | `() → void` | Entry point. Reads `access_token` from URL params (OAuth callback), saves it, then calls `fetchData()`. |
| `fetchData()` | `() → void` | RxJS chain: validates token → fetches accounts → fetches KBs per account (filtered to `SOWNER`/`SCONTRIBUTOR` roles) → determines if saved settings point to a valid KB → calls `initUI()`. |
| `initUI()` | `() → void` | Shows exactly one panel: `#error` (if `?error` query param), `#welcome` (logged in + valid KB + just came from OAuth), `#logged` (logged in, needs config), or `#auth` (not logged in). |
| `setAccountOptions()` | `() → void` | Populates the `#account` `<select>` with fetched accounts and wires a `change` handler to refresh the KB dropdown. |
| `setKbOptions(account)` | `(string) → void` | Populates the `#kb` `<select>` with KBs for the given account. Disables the select if no account is chosen. |
| `saveForm()` | `() → void` | Reads `#account` and `#kb` values, derives the KB zone, saves `{ NUCLIA_ACCOUNT, NUCLIA_KB, ZONE }` to `chrome.storage.local`, briefly shows "Settings saved" text, and sends `{ action: 'UPDATE_MENU' }` to the service worker. |
| `login()` | `() → void` | Redirects to `getLoginUrl()`. |
| `close()` | `() → void` | Closes the current tab via `chrome.tabs.getCurrent` + `chrome.tabs.remove`. |

**Persistent state object (module-level `data`):**

```js
{
  logged: false,          // Whether the current token is valid
  showWelcome: false,     // Whether we just came back from OAuth
  accounts: [],           // Array of Nuclia account objects
  kbs: {},                // Map of accountId → kb[]
  validKb: false,         // Whether saved settings point to an accessible KB
}
```

---

### `options/options.html` — Options Page Markup

Four mutually exclusive panels, each toggled by removing the `hidden` CSS class:

| Element ID | Shown when |
|---|---|
| `#error` | `?error` query param is present (upload failed from context menu) |
| `#auth` | User is not logged in |
| `#welcome` | User just completed OAuth and KB is already configured |
| `#logged` | User is logged in but needs to configure/confirm KB |

Script loading order (critical — each script depends on the previous):
1. `../api.js`
2. `../vendor/rxjs.umd.min.js`
3. `../vendor/nuclia-sdk.umd.min.js`
4. `options.js`

---

## Chrome Extension Manifest Summary

| Field | Value |
|---|---|
| Name | Agentic RAG tools |
| Version | 0.0.6 |
| Manifest version | 3 |
| Background | Service worker: `background.js` |
| Options UI | `options/options.html` (opens in tab) |
| Permissions | `storage`, `contextMenus`, `notifications`, `activeTab`, `scripting` |
| Host permissions | `*://*/*` (all HTTP/HTTPS sites) |
| Web-accessible resources | `options/options.html` accessible from `localhost:4200`, `stashify.cloud`, `nuclia.cloud`, `rag.progress.cloud` |

---

## Settings Stored in `chrome.storage.local`

| Key | Type | Description |
|---|---|---|
| `NUCLIA_ACCOUNT` | string | The user's selected Nuclia account ID |
| `NUCLIA_KB` | string | The selected Knowledge Box ID |
| `NUCLIA_TOKEN` | string | OAuth access token (no refresh; single-use) |
| `ZONE` | string | The zone of the selected KB (e.g., `europe-1`) |

---

## Data Flow: Page Upload

```
User right-clicks → contextMenus.onClicked
  → getSettings()
    → if incomplete: openOptionsPage()
    → if complete:
        → getCurrentTabContent(tabId)   [injects script to get outerHTML]
        → uploadPage(settings, url, html, labels)
            → replaceImages(html, pageUrl)  [fetches & base64-encodes images]
            → createResource(settings, title, htmlBlob, labels, 'text/html')
                → getSDK().db.getKnowledgeBox(…)
                    → kb.createResource(…)
                    → resource.upload('file', blob, …)
            → showNotification(…) on success
            → openOptionsPage() on error
```

---

## How to Consume / Extend

This library is **not imported as a module** by any other app or lib in the monorepo. It is consumed only as a built artifact at `dist/libs/chrome-ext/`.

To extend the extension:
- **Add a new context type** (e.g., right-click on selected text): add an entry to `MENU_TYPES` in `background.js` with a different `name` and `contexts` value.
- **Support token refresh**: update `getSDK()` in `api.js` to pass a `refresh_token` and hook into the SDK's auth refresh lifecycle.
- **Change the target backend**: update `API_URL` and `DASHBOARD_URL` in `api.js`.
- **Add new options page fields**: extend `SETTINGS` in `api.js`, add HTML fields in `options.html`, and update `saveForm()` in `options.js`.

---

## Testing Approach

The Jest configuration (`jest.config.ts`) uses `ts-jest` targeting `*.spec.ts` / `*.test.ts` files. **No test files currently exist** in this library.

The source files are plain `.js` (not TypeScript), so any tests would need to:
- Mock `chrome.*` APIs (use a library like `jest-chrome` or manual mocks).
- Mock `NucliaSDK` and `rxjs` globals (loaded as UMD globals at runtime, not ES imports).
- Test helper functions in `api.js` and `background.js` exported or extracted for testing.

To run (once tests exist):
```bash
nx test chrome-ext
```

---

## Conventions

- **Plain JavaScript, not TypeScript**: all source files are `.js`. No type annotations.
- **UMD globals, not ES imports**: dependencies are accessed as `NucliaSDK.Nuclia`, `rxjs.switchMap`, etc. — not imported — because service workers in Manifest v3 cannot use dynamic `import()` for local scripts loaded via `importScripts`.
- **Static file copy, not bundle**: the build does not run webpack/esbuild/rollup. Files are copied as-is; the extension loads multiple `<script>` tags in order.
- **Manifest v3**: uses a service worker (not a persistent background page) and `chrome.scripting.executeScript` (not `chrome.tabs.executeScript`).
- **No framework**: the options page is vanilla JS DOM manipulation — no Angular, React, or Svelte.
- **Implicit dependency on `sdk-core`**: declared in `project.json` via `"implicitDependencies": ["sdk-core"]` so Nx knows to build `sdk-core` before `chrome-ext`.
