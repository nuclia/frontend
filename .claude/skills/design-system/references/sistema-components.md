# Sistema Components Reference — `@nuclia/sistema`

All components use selector prefix `nsi-`. Import path: `@nuclia/sistema`.  
**Angular rule: `OnPush` everywhere.** All new components must be standalone.

---

## Table of Contents

1. [Layout & Containers](#layout--containers)
2. [Navigation](#navigation)
3. [Buttons & Controls](#buttons--controls)
4. [Form Controls](#form-controls)
5. [Data Display](#data-display)
6. [Labels & Classification](#labels--classification)
7. [Cards](#cards)
8. [Folder Navigation](#folder-navigation)
9. [Progress & Loading](#progress--loading)
10. [Services](#services)
11. [Pipes & Utilities](#pipes--utilities)
12. [NgModule Summary](#ngmodule-summary)

---

## Layout & Containers

### `<nsi-home-container>`
**Standalone:** yes | **Import:** `HomeContainerComponent`

Full-width layout wrapper. Renders `<ng-content>`. Use as root container for dashboard home pages.

```html
<nsi-home-container>
  <h1 class="page-title">Home</h1>
</nsi-home-container>
```

---

### `<nsi-sticky-footer>`
**Standalone:** yes | **Import:** `StickyFooterComponent`

Footer that sticks to the bottom of its scroll container. Renders projected content.

```html
<nsi-sticky-footer>
  <pa-button kind="primary" (click)="save()">Save</pa-button>
  <pa-button aspect="basic" (click)="cancel()">Cancel</pa-button>
</nsi-sticky-footer>
```

---

### `<nsi-two-columns-configuration-item>`
**Standalone:** yes | **Import:** `TwoColumnsConfigurationItemComponent`

Two-column settings row — title/description on the left, action slot on the right.

| Input | Type | Default | Notes |
|-------|------|---------|-------|
| `itemTitle` | `string` | `''` | Row heading |
| `description` | `string` | `''` | Sub-text under heading |
| `badge` | `string \| undefined` | — | Optional badge chip next to title |
| `noTopBorder` | `boolean` | `false` | Suppresses the top separator line |
| `unauthorized` | `boolean` | `false` | Renders locked state |

| Output | Type |
|--------|------|
| `clickOnUnauthorized` | `EventEmitter<void>` |

```html
<nsi-two-columns-configuration-item
  itemTitle="Enable notifications"
  description="Receive alerts when resources are processed">
  <pa-toggle [(ngModel)]="notificationsEnabled"></pa-toggle>
</nsi-two-columns-configuration-item>
```

---

## Navigation

### `<nsi-back-button>`
**Standalone:** yes | **Import:** `BackButtonComponent`

Back-navigation button using Angular Router. Renders ← icon with translated label.

| Input | Type |
|-------|------|
| `link` | `string \| null \| undefined` |

```html
<nsi-back-button [link]="'/resources'"></nsi-back-button>
```

---

## Buttons & Controls

### `<nsi-button-mini>`
**Standalone:** yes | **Import:** `ButtonMiniComponent`

Compact icon button for dense UIs. Has tooltip, destructive and disabled states.

| Input | Type | Default |
|-------|------|---------|
| `icon` | `string \| undefined` | — |
| `destructive` | `boolean` | `false` |
| `disabled` | `boolean` | `false` |
| `help` | `string \| undefined` | — |

```html
<nsi-button-mini icon="edit" help="Edit resource" (click)="edit()"></nsi-button-mini>
<nsi-button-mini icon="delete" [destructive]="true" help="Delete" (click)="delete()"></nsi-button-mini>
```

---

### `<nsi-dropdown-button>`
**Standalone:** yes | **Import:** `DropdownButtonComponent`

Button wired to a Pastanaga `DropdownComponent` via template ref. Passes size/kind/aspect through.

| Input | Type | Default |
|-------|------|---------|
| `popupRef` | `DropdownComponent \| undefined` | — |
| `size` | `Size` | `'medium'` |
| `kind` | `Kind` | `'secondary'` |
| `aspect` | `Aspect` | `'solid'` |
| `open` | `boolean` | `false` |
| `disabled` | `boolean` | `false` |
| `freeWidth` | `boolean` | `false` |
| `fullWidth` | `boolean` | `false` |
| `icon` | `string \| undefined` | — |

```html
<nsi-dropdown-button [popupRef]="menu" (click)="menu.toggle()">Actions</nsi-dropdown-button>
<pa-dropdown #menu>
  <pa-option value="edit">Edit</pa-option>
  <pa-option value="delete">Delete</pa-option>
</pa-dropdown>
```

---

### `<nsi-segmented-buttons>`
**Standalone:** yes | **Import:** `SegmentedButtonsComponent`

Two-option pill toggle (left / right). Labels are i18n keys or plain strings.

| Input | Type | Default |
|-------|------|---------|
| `leftButton` *(required)* | `string` | `''` |
| `rightButton` *(required)* | `string` | `''` |
| `active` | `'left' \| 'right'` | `'left'` |

| Output | Type |
|--------|------|
| `activeChange` | `EventEmitter<'left' \| 'right'>` |

```html
<nsi-segmented-buttons
  leftButton="resource.views.list"
  rightButton="resource.views.grid"
  [(active)]="viewMode">
</nsi-segmented-buttons>
```

---

## Form Controls

### `<nsi-password-input>`
**Module:** `SisPasswordInputModule` (non-standalone) | **Import:** `SisPasswordInputModule`

Password field with show/hide toggle. Extends Pastanaga `NativeTextFieldDirective`.
Inherits all standard `pa-text-field` inputs: `label`, `placeholder`, `help`, `errorMessage`, `disabled`, `required`, etc.
Works with `ngModel`, `formControl`, `formControlName`.

```html
<nsi-password-input
  label="Password"
  formControlName="password"
  [errorMessages]="{ required: 'Password is required' }">
</nsi-password-input>
```

---

### `<nsi-search-input>`
**Standalone:** yes | **Import:** `SearchInputComponent`

Search text field. Optional mode selector (badges) for search type switching.
Inherits all Pastanaga `NativeTextFieldDirective` inputs.

| Input | Type | Default |
|-------|------|---------|
| `modes` | `ControlModel[]` | `[]` |

| Output | Type |
|--------|------|
| `modeSelected` | `EventEmitter<string>` |

```html
<nsi-search-input
  placeholder="Search resources…"
  [(ngModel)]="searchQuery"
  [modes]="searchModes"
  (modeSelected)="onModeChange($event)">
</nsi-search-input>
```

---

### `<nsi-expandable-textarea>`
**Standalone:** yes | **Import:** `ExpandableTextareaComponent`

Textarea with an expand button that opens full-screen editing modal.
Inherits all Pastanaga `TextareaComponent` inputs (`label`, `placeholder`, `help`, `disabled`, `required`, `rows`, etc.).

| Input | Type | Notes |
|-------|------|-------|
| `modalTitle` *(required)* | `string` | Title shown in the expanded modal |

```html
<nsi-expandable-textarea
  label="Description"
  modalTitle="Edit description"
  formControlName="description"
  [rows]="4">
</nsi-expandable-textarea>
```

---

## Data Display

### `<nsi-badge>`
**Standalone:** yes | **Import:** `BadgeComponent`

Small informational chip for counts, icons, or short text.

| Input | Type | Default | Notes |
|-------|------|---------|-------|
| `icon` | `string \| undefined` | — | Adds `.with-icon` host class |
| `count` | `number \| undefined` | — | Adds `.with-count` host class |
| `clickable` | `boolean` | `false` | Adds `.clickable` host class |
| `kind` | `'tertiary' \| 'neutral' \| 'success'` | `'neutral'` | Colour variant |

```html
<nsi-badge [count]="3" kind="tertiary"></nsi-badge>
<nsi-badge icon="warning" kind="neutral"></nsi-badge>
<nsi-badge kind="success">Active</nsi-badge>
```

---

### `<nsi-status>`
**Standalone:** yes | **Import:** `StatusComponent`

Coloured icon for resource processing states.

| Input | Value → Icon |
|-------|-------------|
| `status` | `'processed'` → ✓ green; `'error'` → ⚠ yellow; `'pending'` (default) → – dash |

```html
<nsi-status [status]="resource.status"></nsi-status>
```

---

### `<nsi-json-viewer>`
**Standalone:** yes | **Import:** `JsonViewerComponent`

Renders any JSON as a formatted table using `PaTableModule`.

| Input | Type |
|-------|------|
| `json` | `any` |

```html
<nsi-json-viewer [json]="metadata"></nsi-json-viewer>
```

---

## Labels & Classification

### `<nsi-label>`
**Module:** `SisLabelModule` | **Import:** `SisLabelModule`

Colour-coded chip for classification labels. Background derived from the `LABEL_COLORS` palette.

| Input | Type | Default |
|-------|------|---------|
| `color` | `string` | `LABEL_COLORS[0].mainColor` — must be a hex from `LABEL_COLORS` |
| `disabled` | `boolean` | `false` |
| `readonly` | `boolean` | `false` |
| `neutral` | `boolean` | `false` |

| Output | Type |
|--------|------|
| `removeLabel` | `EventEmitter<{ event: MouseEvent \| KeyboardEvent; value: any }>` |

```html
<nsi-label [color]="label.color" (removeLabel)="remove($event.value)">
  {{ label.title }}
</nsi-label>
```

---

### `<nsi-labels-expander>`
**Standalone:** yes | **Import:** `LabelsExpanderComponent`

One expander per label set with search filter and checkboxes. Depends on `@nuclia/core` types.
Selection key format: `"labelsetId/labelTitle"`.

| Input | Type |
|-------|------|
| `currentSelection` | `{ [key: string]: boolean }` |
| `labelSets` | `LabelSets \| null \| undefined` |

| Output | Type |
|--------|------|
| `updateSelection` | `EventEmitter<{ [key: string]: boolean }>` |

```html
<nsi-labels-expander
  [labelSets]="labelSets$ | async"
  [currentSelection]="selection"
  (updateSelection)="selection = $event">
</nsi-labels-expander>
```

---

## Cards

### `<nsi-action-card>`
**Standalone:** yes | **Import:** `ActionCardComponent`

CTA card with tag-line, title, description, and a text link that navigates via Angular Router.

| Input | Type | Default |
|-------|------|---------|
| `tagLine` | `string \| undefined` | — |
| `title` | `string` | `''` |
| `description` | `string` | `''` |
| `textLink` | `string` | `''` |
| `navigateTo` | `string` | `''` |
| `disabled` | `boolean` | `false` |

```html
<nsi-action-card
  tagLine="New"
  title="Add a data source"
  description="Connect your first data source to start ingesting content."
  textLink="Add data source"
  navigateTo="/sync/add">
</nsi-action-card>
```

---

### `<nsi-info-card>`
**Standalone:** yes | **Import:** `InfoCardComponent`

Content card wrapping projected content with optional icon and colour variant.

| Input | Type | Default |
|-------|------|---------|
| `type` | `'default' \| 'warning' \| 'highlight'` | `'default'` |
| `icon` | `string \| undefined` | — |

```html
<nsi-info-card type="warning" icon="warning">
  <p>This action will remove all indexed data.</p>
</nsi-info-card>
```

---

## Folder Navigation

### `<nsi-folder-list>`
**Standalone:** yes | **Import:** `FolderListComponent`

Ordered list of folder paths rendered in `nsi-info-card` tiles.

| Input | Type | Default |
|-------|------|---------|
| `folders` *(required)* | `string[]` | `[]` |
| `filtered` | `boolean` | `false` |

```html
<nsi-folder-list [folders]="selectedFolders" [filtered]="isFiltered"></nsi-folder-list>
```

---

### `<nsi-folder-tree>`
**Standalone:** yes | **Import:** `FolderTreeComponent`

Recursive selectable folder tree with expand/collapse. Each instance scopes its own `FolderTreeState`.

| Input | Type | Notes |
|-------|------|-------|
| `folderTree` *(required)* | `FolderTree` | Triggers `FolderTreeState.initTree()` on set |
| `selection` | `{ id: string; path: string }[] \| undefined` | Pre-selected nodes |

| Output | Type |
|--------|------|
| `selectionChange` | `EventEmitter<{ id: string; path: string }[]>` |

```html
<nsi-folder-tree
  [folderTree]="rootTree"
  [selection]="currentSelection"
  (selectionChange)="currentSelection = $event">
</nsi-folder-tree>
```

`FolderTree` model:
```ts
interface FolderTree {
  id: string; path: string; displayPath?: string; title: string;
  children?: { [path: string]: FolderTree };
  indeterminate?: boolean; selected?: boolean; expanded?: boolean;
}
```

---

## Progress & Loading

### `<nsi-progress-bar>`
**Standalone:** yes | **Import:** `ProgressBarComponent`

Horizontal progress bar. Pass `null`/`undefined` for indeterminate mode.

| Input | Type | Default |
|-------|------|---------|
| `progress` | `number \| null \| undefined` | `0` — `null`/`undefined` = indeterminate |
| `greyTrack` | `boolean` | `false` |
| `greyBar` | `boolean` | `false` |

```html
<nsi-progress-bar [progress]="uploadProgress"></nsi-progress-bar>
<nsi-progress-bar [progress]="null"></nsi-progress-bar>  <!-- indeterminate -->
```

---

### `<nsi-spinner>`
**Module:** `SisProgressModule` | **Import:** `SisProgressModule`

| Input | Type | Default |
|-------|------|---------|
| `size` | `Size \| undefined` | `'medium'` |

```html
<nsi-spinner size="small"></nsi-spinner>
```

---

### `<nsi-delayed-spinner>`
**Module:** `SisProgressModule` | **Import:** `SisProgressModule`

Shows spinner only after a configurable delay. Prevents flash for fast operations.

| Input | Type | Default |
|-------|------|---------|
| `size` | `Size \| undefined` | `'medium'` |
| `delay` | `number` | `1500` (ms) |

```html
<nsi-delayed-spinner [delay]="500"></nsi-delayed-spinner>
```

---

## Services

### `SisModalService`
**Import:** `SisModalService` from `@nuclia/sistema`  
**See:** SKILL.md → Services section for full example code.

| Method | Returns |
|--------|---------|
| `openModal(component, config?)` | `ModalRef` |
| `openConfirm(data: ConfirmationData)` | `ModalRef` |

---

### `SisToastService`
**Import:** `SisToastService` from `@nuclia/sistema`  
**See:** SKILL.md → Services section for full example code.

| Method | Visual |
|--------|--------|
| `success(message)` | Green toast — "Success" |
| `error(message)` | Red/yellow toast — "Error" |
| `warning(message)` | Dark toast — "Warning" |
| `info(message)` | Light toast — "Information" |

---

## Pipes & Utilities

### `StandaloneMimeIconPipe` / `MimeIconPipe`
Returns a Pastanaga icon name for a MIME type string.

| Module | Use when |
|--------|----------|
| `StandaloneMimeIconPipe` | Standalone components |
| `SisIconsModule` + `MimeIconPipe` | NgModule components |

```html
<pa-icon [name]="file.mimeType | mimeIcon"></pa-icon>
```

Key MIME → icon mappings:
```
application/pdf          → file-pdf
application/stf-link     → link
application/stf-conversation → chat
video/*                  → play
audio/*                  → audio
image/*                  → image
text/*, html, Word, ODT  → file
Excel, CSV               → spreadsheet
message/*                → chat
(unknown)                → file-empty
```

---

## NgModule Summary

| Module | Declares |
|--------|---------|
| `SisLabelModule` | `LabelComponent` |
| `SisPasswordInputModule` | `PasswordInputComponent` |
| `SisProgressModule` | `SpinnerComponent`, `DelayedSpinnerComponent` |
| `SisIconsModule` | `MimeIconPipe` |

All other Sistema symbols are **standalone** — import them directly in `imports: []`.
