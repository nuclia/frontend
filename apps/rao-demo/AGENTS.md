# AGENTS.md — rao-demo

> Comprehensive reference guide for AI agents and developers working on the `apps/rao-demo` application.

---

## App Overview and Purpose

`rao-demo` is a **minimal React shell application** whose sole purpose is to render the `rao-widget` library component (`RaoWrapper`) in a browser for **interactive development, manual testing, and live demonstration** of the RAO (Retrieval Agent Orchestration) widget.

It is intentionally thin — no business logic lives here. All meaningful code lives in `libs/rao-widget`. The demo app wires up hardcoded credentials pointing to a Progress/Stashify Cloud backend and displays the widget at full page.

Key characteristics:
- Single page, no routing.
- Credentials (`aragid`, `account`, `zone`, `backend`) are hardcoded in `src/app/app.tsx` for the demo environment.
- The API key is injected via an environment variable (`VITE_API_KEY`) so it is never committed.
- Excluded from CI test and build pipelines (see `test.yml` / `deploy.yml`).

---

## Tech Stack

| Layer | Choice |
|---|---|
| UI framework | **React 18** (JSX transform via `react-jsx`) |
| Language | **TypeScript** (`.tsx` throughout) |
| Build tool | **Vite** (`@vitejs/plugin-react`) |
| Monorepo tooling | **Nx** (`@nx/vite`, `nxViteTsPaths`, `nxCopyAssetsPlugin`) |
| Linting | ESLint — inherits root `.eslintrc` via `eslint.config.cjs` |
| Testing | None configured for this app |

---

## Project Structure

```
apps/rao-demo/
├── index.html                 # HTML shell — mounts <div id="root">, loads /src/main.tsx
├── vite.config.ts             # Vite config: React plugin, Nx path resolution, dev port 4201
├── project.json               # Nx project manifest — only "serve" target defined
├── tsconfig.json              # Root TS config — references tsconfig.app.json
├── tsconfig.app.json          # App TS config — includes src/**/* , excludes test files
├── eslint.config.cjs          # ESLint — delegates to root .eslintrc
├── public/
│   └── favicon.ico            # Static favicon
└── src/
    ├── main.tsx               # React entry point — createRoot → <StrictMode><App /></StrictMode>
    ├── assets/                # Static asset directory (currently empty, .gitkeep only)
    └── app/
        └── app.tsx            # Root component — renders <RaoWrapper> with demo credentials
```

---

## Architecture

```
index.html
  └── src/main.tsx              (React bootstrap, ReactDOM.createRoot → #root)
        └── src/app/app.tsx     (App component — no state, no routing)
              └── <RaoWrapper>  (from libs/rao-widget/src/RaoWrapper)
                    ├── Initialises Nuclia SDK (NucliaOptions → new Nuclia(...))
                    ├── Loads SVG icon sprite from CDN
                    └── <RaoApp>  (wraps RaoProvider + RaoWidget)
```

There is **no client-side routing**. The entire app is a single view that mounts the widget.

---

## Key Components / Files

### `src/main.tsx`

Standard React 18 entry. Creates the root and wraps `<App />` in `<StrictMode>`.

```tsx
const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(<StrictMode><App /></StrictMode>);
```

### `src/app/app.tsx`

The only application component. Renders `<RaoWrapper>` with demo-environment credentials:

```tsx
import { RaoWrapper } from '../../../../libs/rao-widget/src/RaoWrapper';

export function App() {
  return (
    <div>
      <RaoWrapper
        aragid="cc3a6f24-bb9f-4009-b610-39df8a83b214"   // Retrieval Agent ID
        account="90288af7-5755-47bf-9700-d1ade78f7294"  // Nuclia account ID
        apikey={import.meta.env.VITE_API_KEY}            // from .env (never commit)
        zone="europe-1"
        backend="https://stashify.cloud/api"
      />
    </div>
  );
}
```

> **Note:** The import uses a deep relative path (`../../../../libs/rao-widget/src/RaoWrapper`) rather than the workspace alias (`rao-widget`). This is intentional to ensure the dev server picks up live source changes inside the library.

---

## External Library Usage

### `libs/rao-widget` (internal monorepo library)

The demo exclusively consumes `libs/rao-widget`. Key exports used:

| Export | File | Role |
|---|---|---|
| `RaoWrapper` | `libs/rao-widget/src/RaoWrapper.tsx` | Top-level React component; accepts connection props, initialises Nuclia SDK, loads SVG sprite, renders `<RaoApp>` |
| `RaoApp` | `libs/rao-widget/src/RaoApp.tsx` | Wraps `RaoProvider` context + `RaoWidget` |
| `RaoProvider` | `libs/rao-widget/src/hooks/RaoProvider.tsx` | React context provider for Nuclia state |
| `RaoWidget` | `libs/rao-widget/src/components/RaoWidget/` | The visual chat/RAG widget UI |
| Web component | `libs/rao-widget/src/web-component.tsx` | Registers `<progress-rao-widget>` custom element (used separately) |

### `@nuclia/core` (internal monorepo lib → `libs/sdk-core`)

Used inside `RaoWrapper` to create a `Nuclia` client instance:

```ts
import { type NucliaOptions, Nuclia } from '@nuclia/core';
const nucliaAPI = new Nuclia(nucliaOptions);
```

### CDN assets

`RaoWrapper` fetches an SVG icon sprite at runtime from:
```
https://cdn.rag.progress.cloud/icons/glyphs-sprite.svg
```
(configurable via `VITE_CDN` env variable)

---

## Build and Run Commands

### Start the dev server

```bash
# Via Nx (recommended)
nx serve rao-demo

# Or directly with Vite
cd apps/rao-demo && vite
```

Dev server runs at: **http://localhost:4201**

### Build (production)

There is no dedicated `build` target in `project.json`. To build, run Vite directly:

```bash
cd apps/rao-demo && vite build
```

Output: `dist/apps/rao-demo/`

### Lint

```bash
nx lint rao-demo
```

### No test target

`rao-demo` has no test configuration and is explicitly excluded from CI test runs.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `VITE_API_KEY` | Yes (for auth) | Nuclia API key injected at build/dev time |
| `VITE_CDN` | No | Override CDN base URL for the SVG icon sprite (default: `https://cdn.rag.progress.cloud/`) |

Create a `.env` file at the repo root or at `apps/rao-demo/.env`:

```env
VITE_API_KEY=your-nuclia-api-key-here
```

---

## Important Conventions and Patterns

1. **Deep relative import over alias**: `app.tsx` imports `RaoWrapper` via a relative `../../../../libs/rao-widget/src/RaoWrapper` path. This ensures Vite's HMR picks up source changes in the library during development without a separate build step. Do **not** change this to the `rao-widget` alias unless you want to consume the library's compiled output.

2. **Credentials are demo-only**: The `aragid` and `account` values in `app.tsx` are hardcoded for a shared demo environment on `stashify.cloud`. Change them freely for local experiments; do not commit production credentials.

3. **No state, no routing**: Keep `app.tsx` as a dumb wrapper. Any new pages or state belong in `libs/rao-widget` or a separate app.

4. **Not in CI pipelines**: `rao-demo` is excluded from the `nx affected` test and build steps in both `test.yml` and `deploy.yml`. It is never deployed automatically.

5. **Vite config extends Nx plugins**: `nxViteTsPaths()` resolves workspace path aliases (e.g. `@nuclia/core` → `libs/sdk-core`). `nxCopyAssetsPlugin(['*.md'])` copies markdown files to the dist folder.

6. **`jsx: "react-jsx"`**: Configured in `tsconfig.json`. No manual `import React` is required in `.tsx` files.
