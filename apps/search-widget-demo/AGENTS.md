# AGENTS.md — search-widget-demo

## App Overview

`search-widget-demo` is a **local dev sandbox** for `libs/search-widget`. It lets engineers iterate on Nuclia widgets in a live browser environment without deploying to CDN or npm. **Not a production app.**

Tech stack: **Svelte 4** + **Vite 5** + TypeScript 5. No SvelteKit routing — single page, no router.

---

## Project Structure

```
apps/search-widget-demo/
├── index.html          # HTML shell (<div id="app">)
├── vite.config.ts      # Vite config: @nuclia/core alias, publicDir → libs/search-widget/public
├── svelte.config.js    # svelte-preprocess + adapter-auto (unused at runtime)
├── project.json        # Nx targets: serve, lint, check, test
└── src/
    ├── main.ts         # svelte mount()
    └── App.svelte      # Root: hard-codes backend/zone/kb/apikey, imports widgets from source
```

**Key path aliases (Vite):**  
`@nuclia/core` → `libs/sdk-core/src/index.ts` (overrides npm package so local SDK changes apply)

---

## Architecture

```
index.html
  └─ App.svelte
       ├─ <NucliaAragWidget>      ← active (uncomment one at a time)
       ├─ <NucliaSearchBar>       ← commented out
       ├─ <NucliaSearchResults>   ← companion to SearchBar
       ├─ <NucliaChat>            ← commented out
       └─ <NucliaPopupWidget>     ← commented out
```

Only one widget variant active at a time — widgets share a singleton RxJS store layer; running multiple conflicting widgets may cause state collisions.

Widgets are imported directly from `../../libs/search-widget/src/widgets` — **no build step or npm publish needed**.

---

## Widget Integration

Active widget: `<NucliaAragWidget>` (default). To switch, comment/uncomment blocks in `App.svelte`.

```svelte
<!-- JWT auth via token prop -->
<NucliaAragWidget
  backend="https://stashify.cloud/api"
  zone="europe-1"
  arag="<arag-id>"
  apikey="<key>"   <!-- WARNING: don't commit API key -->
  session="ephemeral"
/>
```

CSS imported in `App.svelte` from `libs/search-widget/src/common/global.css` and `common-style.css`.

---

## Run Commands

```bash
nx serve search-widget-demo   # Vite dev server → http://localhost:5173
nx test search-widget-demo    # Vitest (passWithNoTests — tests live in libs/search-widget)
nx lint search-widget-demo
```

---

## Important Conventions

1. **Direct source imports** — widgets always come from `libs/search-widget/src/…`, not npm. Changes to the lib appear immediately.
2. **One widget at a time** — only one section in `App.svelte` uncommented. State collisions occur when multiple conflicting widgets run simultaneously.
3. **No API key in VCS** — `App.svelte` has a `// WARNING: don't commit API key` comment. Replace key with placeholder before committing.
4. **`cdn="/"` in local dev** — when using `NucliaSearchBar` or `NucliaChat` locally, set `cdn="/"` so assets load from Vite dev server (`libs/search-widget/public` is `publicDir`).
5. **Session prop** — `'ephemeral'` (stateless) or a UUID string (persistent conversation history).
6. **Svelte 4 vs 5 runes** — `App.svelte` uses Svelte 4 style (`export let`, `onMount`); widget internals use Svelte 5 runes (`$props`, `$state`, `$derived`, `$effect`). Both work via Vite transpilation.
7. **No SCSS in demo app** — lib components may use SCSS; the demo itself uses CSS/inline styles only.
