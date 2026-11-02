# AGENTS.md — `libs/sistema`

## Library Overview

`@nuclia/sistema` is Nuclia's Angular design system library built on top of Pastanaga Angular.
Provides: `nsi-*` components, SCSS design tokens, static assets (SVG sprite, fonts, logos),
`SisModalService`, `SisToastService`, `mimeIcon` pipe, and label/folder utilities.

All `nsi-` components are in `src/lib/`. Public barrel: `src/index.ts`.

---

## Project Structure

```
libs/sistema/
├── src/
│   ├── index.ts          # Public barrel
│   └── lib/              # Components (see catalog below)
├── styles/               # App-level SCSS helpers
│   ├── _overrides.scss   # Main entry — forwards all tokens + Pastanaga utils
│   ├── _variables.scss   # Convenience variables ($height-top-bar, $width-sidenav, etc.)
│   ├── _mixins.scss      # dark-mode(), reset-button(), text-truncate(), scrollbar-style()
│   └── _apps-common.scss # Root CSS vars (--app-background-color, etc.) + utility classes
├── theme/tokens/         # SCSS design-token files (_palette, _spacing, _typography, …)
├── assets/               # glyphs-sprite.svg, icons/, fonts/, logos/, connector-logos/
└── glyphs/               # ~110 source SVG icons
```

---

## Component Catalog

| Selector                               | Brief purpose                                                                                                                                                                                                                                                                                     |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<nsi-home-container>`                 | Full-width layout wrapper for home pages                                                                                                                                                                                                                                                          |
| `<nsi-sticky-footer>`                  | Projected footer sticky to scroll area bottom                                                                                                                                                                                                                                                     |
| `<nsi-two-columns-configuration-item>` | title/description + action row for settings pages                                                                                                                                                                                                                                                 |
| `<nsi-back-button>`                    | Back-nav icon button — `[routerLink]` for internal paths, or a real `<a [href]>` (external navigation) when the `link` input is an absolute `http(s)://` URL (checked via a local `isExternalLink()` computed signal, not `NavigationService`, to avoid a `sistema` ← `core` circular dependency) |
| `<nsi-button-mini>`                    | Compact icon button with optional tooltip, destructive variant                                                                                                                                                                                                                                    |
| `<nsi-country-select>`                 | Searchable country dropdown wrapping `pa-typeahead-select`; full `ControlValueAccessor`; emoji flags (🇺🇸 🇬🇧); signal inputs (`id`, `readonly`, `errorMessages`, `externalLabel`)                                                                                                                  |
| `<nsi-dropdown-button>`                | Button wired to `pa-dropdown`                                                                                                                                                                                                                                                                     |
| `<nsi-segmented-buttons>`              | Two-option pill toggle                                                                                                                                                                                                                                                                            |
| `<nsi-password-input>`                 | Password field with show/hide toggle; integrates with `NgControl`                                                                                                                                                                                                                                 |
| `<nsi-search-input>`                   | Text search field with optional mode-selector badge dropdown                                                                                                                                                                                                                                      |
| `<nsi-expandable-textarea>`            | Textarea with expand button → full-screen modal via `SisModalService`                                                                                                                                                                                                                             |
| `<nsi-badge>`                          | Info chip/badge (count, icon, short text); 3 `kind` variants                                                                                                                                                                                                                                      |
| `<nsi-status>`                         | Coloured icon for 3 resource states                                                                                                                                                                                                                                                               |
| `<nsi-json-viewer>`                    | Formatted JSON in `PaTableModule`                                                                                                                                                                                                                                                                 |
| `<nsi-label>`                          | Colour-coded classification chip; removal support                                                                                                                                                                                                                                                 |
| `<nsi-labels-expander>`                | Expander per label set with search + checkboxes                                                                                                                                                                                                                                                   |
| `<nsi-action-card>`                    | CTA card with tag-line, title, description, router link                                                                                                                                                                                                                                           |
| `<nsi-info-card>`                      | Content card with optional icon and colour variant                                                                                                                                                                                                                                                |
| `<nsi-folder-list>`                    | Ordered folder path tiles inside `nsi-info-card`                                                                                                                                                                                                                                                  |
| `<nsi-folder-tree>`                    | Recursive selectable tree (each instance owns `FolderTreeState`)                                                                                                                                                                                                                                  |
| `<nsi-progress-bar>`                   | Horizontal progress; `null` → indeterminate mode                                                                                                                                                                                                                                                  |
| `<nsi-skeleton>`                       | Placeholder content block with configurable `width`, `height`, and `borderRadius` (`'small'`, `'medium'` or `'round'`); signal inputs                                                                                                                                                             |
| `<nsi-spinner>`                        | Circular spinner                                                                                                                                                                                                                                                                                  |
| `<nsi-delayed-spinner>`                | Spinner that appears after 1500 ms delay                                                                                                                                                                                                                                                          |

**Components are standalone** (Angular 22 default — no `standalone` flag) — import them directly. The only NgModules are thin re-export wrappers: `SisLabelModule` (`<nsi-label>`) and `SisPasswordInputModule` (`<nsi-password-input>`).

---

## Services

### `SisModalService`

Wraps Pastanaga `ModalService` with Nuclia defaults (`cancelAspect: 'basic'`).

```ts
const ref = this.modal.openModal(MyDialogComponent, new ModalConfig({ data: {...} }));
ref.onClose.subscribe(result => { ... });

this.modal.openConfirm({ title: 'Delete?', cancelLabel: 'Cancel', confirmLabel: 'Delete' });
```

### `SisToastService`

Wraps Pastanaga `ToastService` with fixed icon/title conventions. `warning` and `error` toasts get close buttons automatically.

```ts
this.toast.success('Resource created!'); // info | success | warning | error
this.toast.error('Something went wrong.');
```

---

## Pipes

### `mimeIcon`

Converts MIME type string → Pastanaga icon name (`'application/pdf'` → `'file-pdf'`, unknown → `'file-empty'`).

- `MimeIconPipe` — standalone pipe (import directly)
- `StandaloneMimeIconPipe` — extends `MimeIconPipe`; same behaviour

---

## SCSS Design Tokens

### Token Files (`theme/tokens/`)

`_palette` · `_spacing` · `_typography` · `_buttons` · `_body` · `_card` · `_chips` · `_expander` · `_menu` · `_modal` · `_popover` · `_scrollbar` · `_shadows` · `_table` · `_tabs` · `_textfield` · `_toasts` · `_toggle` · `_z-index`

### How to import in apps

```scss
// Global stylesheet
@use '@nuclia/sistema/styles/overrides'; // all tokens + Pastanaga utils
@use '@nuclia/sistema/styles/apps-common'; // root CSS vars, base typography

// Component stylesheet (via includePaths)
@use 'variables'; // app-level SCSS alias
```

### White-label override hook

```css
:root {
  --custom-color-primary-regular: hsl(200, 90%, 50%);
  --custom-font-family: 'MyFont';
}
```

### Icon consumption

Use `<pa-icon name="circle-check">`. Never reference SVG paths directly.

---

## Import Patterns

```ts
// Components, pipes (all standalone)
import { BadgeComponent, SisStatusComponent, SpinnerComponent, MimeIconPipe } from '@nuclia/sistema';

// Wrapper NgModules (only two)
import { SisLabelModule, SisPasswordInputModule } from '@nuclia/sistema';

// Services (providedIn: 'root' — inject directly)
import { SisModalService, SisToastService } from '@nuclia/sistema';
```

Path alias: `"@nuclia/sistema": ["libs/sistema/src/index.ts"]`

---

## Run Commands

```bash
nx test sistema    # Vitest unit tests via Angular builder (own test-build target)
nx lint sistema    # ESLint
```

> No `build` target — consumed as TypeScript source via the monorepo path mapping.

---

## Important Conventions

1. **Selector prefix `nsi-`** — do not use in consuming apps for custom components.
2. **Standalone only** — new components are standalone; don't add NgModules.
3. **Token override** — customise via `--custom-*` CSS hooks; never fork SCSS token files.
4. **Modal pattern** — use `SisModalService`, not `ModalService` directly (ensures `cancelAspect: 'basic'`).
5. **Toast pattern** — use `SisToastService` methods; never construct `ToastConfig` manually.
6. **`FolderTreeState` scoping** — not `providedIn: 'root'`; scoped to `FolderTreeComponent`. Never inject outside that tree.
7. **Icon consumption** — use `<pa-icon>` with icon names from `glyphs/`. Do not reference SVG paths directly.
8. **OnPush everywhere** — all components use `OnPush`. Trigger change detection manually when mutating inputs by reference.
9. **No `build` target** — library is TypeScript source only; only `test` and `lint` targets exist.
