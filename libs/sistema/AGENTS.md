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

| Selector                               | Module / Standalone | Brief purpose                                                                                                                                                                    |
| -------------------------------------- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<nsi-home-container>`                 | standalone          | Full-width layout wrapper for home pages                                                                                                                                         |
| `<nsi-sticky-footer>`                  | standalone          | Projected footer sticky to scroll area bottom                                                                                                                                    |
| `<nsi-two-columns-configuration-item>` | standalone          | title/description + action row for settings pages                                                                                                                                |
| `<nsi-back-button>`                    | standalone          | Router back-nav icon button                                                                                                                                                      |
| `<nsi-button-mini>`                    | standalone          | Compact icon button with optional tooltip, destructive variant                                                                                                                   |
| `<nsi-country-select>`                 | standalone          | Searchable country dropdown wrapping `pa-typeahead-select`; full `ControlValueAccessor`; emoji flags (🇺🇸 🇬🇧); signal inputs (`id`, `readonly`, `errorMessages`, `externalLabel`) |
| `<nsi-dropdown-button>`                | standalone          | Button wired to `pa-dropdown`                                                                                                                                                    |
| `<nsi-segmented-buttons>`              | standalone          | Two-option pill toggle                                                                                                                                                           |
| `<nsi-password-input>`                 | standalone          | Password field with show/hide toggle; integrates with `NgControl`                                                                                                                |
| `<nsi-search-input>`                   | standalone          | Text search field with optional mode-selector badge dropdown                                                                                                                     |
| `<nsi-expandable-textarea>`            | standalone          | Textarea with expand button → full-screen modal via `SisModalService`                                                                                                            |
| `<nsi-badge>`                          | standalone          | Info chip/badge (count, icon, short text); 3 `kind` variants                                                                                                                     |
| `<nsi-status>`                         | standalone          | Coloured icon for 3 resource states                                                                                                                                              |
| `<nsi-json-viewer>`                    | standalone          | Formatted JSON in `PaTableModule`                                                                                                                                                |
| `<nsi-label>`                          | `SisLabelModule`    | Colour-coded classification chip; removal support                                                                                                                                |
| `<nsi-labels-expander>`                | standalone          | Expander per label set with search + checkboxes                                                                                                                                  |
| `<nsi-action-card>`                    | standalone          | CTA card with tag-line, title, description, router link                                                                                                                          |
| `<nsi-info-card>`                      | standalone          | Content card with optional icon and colour variant                                                                                                                               |
| `<nsi-folder-list>`                    | standalone          | Ordered folder path tiles inside `nsi-info-card`                                                                                                                                 |
| `<nsi-folder-tree>`                    | standalone          | Recursive selectable tree (each instance owns `FolderTreeState`)                                                                                                                 |
| `<nsi-progress-bar>`                   | standalone          | Horizontal progress; `null` → indeterminate mode                                                                                                                                 |
| `<nsi-skeleton>`                       | standalone          | Placeholder content block with configurable `width`, `height`, and `borderRadius` (`'small'`\|`'medium'`\|`'round'`); signal inputs                                              |
| `<nsi-spinner>`                        | `SisProgressModule` | Circular spinner                                                                                                                                                                 |
| `<nsi-delayed-spinner>`                | `SisProgressModule` | Spinner that appears after 1500 ms delay                                                                                                                                         |

**NgModules** (legacy): `SisLabelModule`, `SisPasswordInputModule`, `SisProgressModule`, `SisIconsModule` (`MimeIconPipe`).  
All newer components are standalone — import them directly.

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

- `MimeIconPipe` — NgModule (`SisIconsModule`), `standalone: false`
- `StandaloneMimeIconPipe` — standalone import

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
// Standalone components
import { BadgeComponent, SisStatusComponent } from '@nuclia/sistema';

// NgModule components
import { SisLabelModule, SisProgressModule } from '@nuclia/sistema';

// Services (providedIn: 'root' — inject directly)
import { SisModalService, SisToastService } from '@nuclia/sistema';

// Standalone pipe
import { StandaloneMimeIconPipe } from '@nuclia/sistema';
```

Path alias: `"@nuclia/sistema": ["libs/sistema/src/index.ts"]`

---

## Run Commands

```bash
nx test sistema    # Jest unit tests
nx lint sistema    # ESLint
```

> No `build` target — consumed as TypeScript source via the monorepo path mapping.

---

## Important Conventions

1. **Selector prefix `nsi-`** — do not use in consuming apps for custom components.
2. **Standalone-first** — new components must be standalone. Legacy NgModules are backwards-compat only.
3. **Token override** — customise via `--custom-*` CSS hooks; never fork SCSS token files.
4. **Modal pattern** — use `SisModalService`, not `ModalService` directly (ensures `cancelAspect: 'basic'`).
5. **Toast pattern** — use `SisToastService` methods; never construct `ToastConfig` manually.
6. **`FolderTreeState` scoping** — not `providedIn: 'root'`; scoped to `FolderTreeComponent`. Never inject outside that tree.
7. **Icon consumption** — use `<pa-icon>` with icon names from `glyphs/`. Do not reference SVG paths directly.
8. **OnPush everywhere** — all components use `OnPush`. Trigger change detection manually when mutating inputs by reference.
9. **No `build` target** — library is TypeScript source only; only `test` and `lint` targets exist.
