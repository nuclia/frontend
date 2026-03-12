# Pastanaga Angular Components Reference — `@guillotinaweb/pastanaga-angular`

All components use selector prefix `pa-`. Most are **NgModule-based** (import the `Pa*Module`).
Exceptions: `AccordionComponent` and `AccordionItemComponent` are standalone.

---

## Table of Contents

1. [Buttons & Basic Interaction](#buttons--basic-interaction)
2. [Form Controls](#form-controls)
3. [Layout & Navigation](#layout--navigation)
4. [Overlays (Modal, Toast, Dropdown, Popup)](#overlays)
5. [Data Display (Table, Tabs, Chips, Avatar)](#data-display)
6. [Utility (Tooltip, Scroll, Translate, Breakpoint)](#utility)
7. [Common Types](#common-types)

---

## Buttons & Basic Interaction

### `pa-button` — `PaButtonModule`

| Input | Type | Default | Options |
|-------|------|---------|---------|
| `kind` | `Kind` | `'secondary'` | `'primary'`, `'secondary'`, `'inverted'`, `'destructive'` |
| `size` | `Size` | `'medium'` | `'small'`, `'medium'`, `'large'`, `'xlarge'`, `'xxlarge'` |
| `aspect` | `Aspect` | `'solid'` | `'solid'`, `'basic'` |
| `type` | `string` | `'button'` | `'button'`, `'submit'`, `'reset'` |
| `disabled` | `boolean` | `false` | |
| `active` | `boolean` | `false` | Pressed/active visual state |
| `icon` | `string` | `''` | Glyph name — uses `<pa-icon>` inside |
| `iconAndText` | `boolean` | `false` | Icon + label layout |
| `iconSize` | `Size` | — | Override icon size independently |

```html
<pa-button kind="primary" (click)="save()">Save</pa-button>
<pa-button kind="secondary" aspect="basic" (click)="cancel()">Cancel</pa-button>
<pa-button kind="destructive" icon="delete" [iconAndText]="true">Delete</pa-button>
```

### `pa-card` — `PaCardModule`

Clickable card with hover/focus states.

| Input | Type | Output |
|-------|------|--------|
| `disabled` | `boolean` | `cardClick: MouseEvent \| KeyboardEvent` |

```html
<pa-card (cardClick)="select()">
  <p>Card content</p>
</pa-card>
```

---

## Form Controls

All form controls extend `PaFormControlDirective` → implement `ControlValueAccessor`.
Work with `ngModel`, `formControl`, and `formControlName`. Module: `PaTextFieldModule` or `PaTogglesModule`.

### Shared base inputs (all form controls)

| Input | Type | Description |
|-------|------|-------------|
| `id` | `string` | Element id |
| `name` | `string` | Element name |
| `value` | `any` | Current value |
| `disabled` | `boolean` | |
| `readonly` | `boolean` | |
| `help` | `string` | Help text below field |
| `errorMessages` | `IErrorMessages` | `{ required: 'msg', minLength: 'msg', … }` |

### `pa-input` — `PaTextFieldModule`

Additional inputs: `type`, `placeholder`, `icon`, `iconOnRight`, `min`, `max`, `step`, `autocapitalize`, `externalLabel`.

```html
<pa-input label="Name" formControlName="name" [errorMessages]="{ required: 'Name is required' }"></pa-input>
<pa-input type="number" label="Count" [min]="0" [max]="100" formControlName="count"></pa-input>
<pa-input label="Search" icon="search" formControlName="query"></pa-input>
```

### `pa-textarea` — `PaTextFieldModule`

Additional inputs: `placeholder`, `externalLabel`, `rows`.

```html
<pa-textarea label="Notes" formControlName="notes" [rows]="4"></pa-textarea>
```

### `pa-select` — `PaTextFieldModule`

Additional inputs: `label`, `placeholder`, `options: OptionType[]`, `multiple: boolean`, `adjustHeight`, `dim`, `showAllErrors`.  
Output: `expanded: EventEmitter<boolean>`.

```html
<pa-select label="Type" formControlName="type" [options]="typeOptions"></pa-select>
<!-- or with pa-option children: -->
<pa-select label="Role" formControlName="role">
  <pa-option value="admin">Admin</pa-option>
  <pa-option value="viewer">Viewer</pa-option>
</pa-select>
```

### `pa-typeahead-select` — `PaTextFieldModule`

Same API as `pa-select` but with live filtering input.

### `pa-checkbox` — `PaTogglesModule`

Additional inputs: `noEllipsis: boolean`, `indeterminate: boolean`.  
Output: `indeterminateChange`.

```html
<pa-checkbox [(ngModel)]="enabled">Enable feature</pa-checkbox>
```

### `pa-toggle` — `PaTogglesModule`

Additional inputs: `labelOnRight`, `hasFocus`, `withBackground`, `spaceBetweenLabelAndToggle`.

```html
<pa-toggle [(ngModel)]="isActive">Active</pa-toggle>
```

### `pa-radio` + `paRadioGroup` — `PaTogglesModule`

`pa-radio` inputs: `id`, `name`, `value`, `disabled`, `ariaLabel`, `help`, `popoverHelp`, `noEllipsis`.  
Output: `change: { value, checked }`.  
Wrap in `[paRadioGroup]` directive to link them.

```html
<div paRadioGroup name="mode" [(ngModel)]="selectedMode">
  <pa-radio value="auto">Automatic</pa-radio>
  <pa-radio value="manual">Manual</pa-radio>
</div>
```

### `pa-slider` — `PaSliderModule`

Additional inputs: `min` (0), `max` (100), `step` (1). Plus all base form inputs.

```html
<pa-slider label="Volume" [min]="0" [max]="100" [(ngModel)]="volume"></pa-slider>
```

### `[nativeTextField]` directive

Directive for wrapping a plain `<input>` or `<textarea>` with Pastanaga label/help/error-message machinery.

```html
<div nativeTextField label="Email" [help]="'Enter your email address'">
  <input type="email" [(ngModel)]="email" />
</div>
```

---

## Layout & Navigation

### `pa-accordion` + `pa-accordion-item` — standalone

```html
<pa-accordion [allowMultipleExpanded]="false">
  <pa-accordion-item id="item1" itemTitle="Section 1" description="Optional sub-text">
    <ng-template pa-accordion-item-body>
      Content loaded lazily
    </ng-template>
  </pa-accordion-item>
</pa-accordion>
```

`pa-accordion` inputs: `allowMultipleExpanded`, `noBorders`, `small`.  
`pa-accordion-item` inputs: `id` *(required)*, `itemTitle` *(required)*, `description`, `expanded`.  
`pa-accordion-item` output: `expandedChange: boolean`.

### `pa-expander` — `PaExpanderModule`

```html
<pa-expander>
  <ng-template pa-expander-header>Header text</ng-template>
  <ng-template pa-expander-body>Body content</ng-template>
</pa-expander>
```

Directives: `pa-expander-header`, `pa-expander-header-side-block`, `pa-expander-body`.

### `pa-side-nav` — `PaSideNavModule`

```html
<pa-side-nav>
  <ng-template pa-side-nav-header>Logo</ng-template>
  <ng-template pa-side-nav-content>
    <pa-side-nav-item [active]="true">Settings</pa-side-nav-item>
  </ng-template>
  <ng-template pa-side-nav-footer>Footer</ng-template>
</pa-side-nav>
```

`pa-side-nav-item` input: `active: boolean`.

### `pa-tabs` + `pa-tab` — `PaTabsModule`

```html
<pa-tabs [noSlider]="false" [notFullWidth]="true">
  <pa-tab [active]="tab === 'settings'" (click)="tab = 'settings'">Settings</pa-tab>
  <pa-tab [active]="tab === 'usage'" (click)="tab = 'usage'">Usage</pa-tab>
</pa-tabs>
```

`pa-tabs` inputs: `noSlider`, `notFullWidth`.  
`pa-tab` input: `active: boolean`.

---

## Overlays

### Modal System — `PaModalModule`

**Always use `SisModalService` (not `ModalService` directly) in apps.** See sistema-components.md → Services.

Modal slot directives (inside `<pa-modal-dialog>`):
- `pa-modal-title` — heading
- `pa-modal-description` — optional sub-heading
- `pa-modal-content` — scrollable body (use `pa-modal-image` for image variant)
- `pa-modal-footer` — button row

```html
<pa-modal-dialog>
  <pa-modal-title>Confirm</pa-modal-title>
  <pa-modal-description>Are you sure?</pa-modal-description>
  <pa-modal-content>
    <p>Detailed explanation here.</p>
  </pa-modal-content>
  <pa-modal-footer>
    <pa-button kind="primary" (click)="modal.close(true)">Confirm</pa-button>
    <pa-button aspect="basic" (click)="modal.dismiss()">Cancel</pa-button>
  </pa-modal-footer>
</pa-modal-dialog>
```

`ModalConfig`:
```ts
new ModalConfig({ dismissable: true, data: { myKey: 'value' } })
```

`ModalRef<D, R>`:
- `config.data` — access passed data
- `onClose: Observable<R>` — successful close
- `onDismiss: Observable<R>` — cancelled
- `close(result?)` / `dismiss(result?)` — trigger from component

`ConfirmationData`:
```ts
{
  title: string;
  description?: string;
  confirmLabel?: string;   // default 'Yes'
  cancelLabel?: string;    // default 'Cancel'
  isDestructive?: boolean;
  onlyConfirm?: boolean;
  cancelAspect?: Aspect;   // SisModalService forces 'basic'
}
```

### Toast System — `PaToastModule`

**Always use `SisToastService` in apps.** See sistema-components.md → Services.

When using `ToastService` directly (rare):
```ts
this.toastService.openSuccess('Done!', { title: 'Success', autoClose: true });
```

`ToastConfig`: `{ autoClose?, icon?, title?, translateParams?, button?: { label?, icon?, action() } }`

### Dropdown — `PaDropdownModule`

Pattern: `[paPopup]` on trigger + `<pa-dropdown #ref>` as template target.

```html
<button [paPopup]="menu">Open ▾</button>
<pa-dropdown #menu>
  <pa-option value="edit" (click)="edit()">Edit</pa-option>
  <pa-option-header>Danger zone</pa-option-header>
  <pa-separator></pa-separator>
  <pa-option value="delete" (click)="delete()">Delete</pa-option>
</pa-dropdown>
```

`[paPopup]` directive inputs:
- `paPopup: PopupComponent` — template ref
- `alignPopupOnLeft: boolean`
- `popupOnTop: boolean`
- `sameWidth: boolean`
- `popupDisabled: boolean`
- `popupVerticalOffset: number`

`pa-dropdown` input: `role: 'listbox' | 'menu'` (default `'menu'`).

### Popup — `PaPopupModule`

Low-level popup for custom content (non-list):

```html
<button [paPopup]="myPopup">Open</button>
<pa-popup #myPopup>
  <p>Custom popup content</p>
</pa-popup>
```

For floating help text: `[paPopover]` + `<pa-popover>`.

---

## Data Display

### Table — `PaTableModule`

CSS Grid-based. Columns are defined via `[columns]` (CSS `grid-template-columns` string).

```html
<pa-table columns="2fr 1fr 1fr auto">
  <pa-table-row-header>
    <pa-table-cell>Name</pa-table-cell>
    <pa-table-cell>Status</pa-table-cell>
    <pa-table-cell>Date</pa-table-cell>
    <pa-table-cell></pa-table-cell>
  </pa-table-row-header>
  <pa-table-row *ngFor="let item of items">
    <pa-table-cell>{{ item.name }}</pa-table-cell>
    <pa-table-cell>{{ item.status }}</pa-table-cell>
    <pa-table-cell>{{ item.date }}</pa-table-cell>
    <pa-table-cell-menu>
      <pa-option (click)="edit(item)">Edit</pa-option>
    </pa-table-cell-menu>
  </pa-table-row>
</pa-table>
```

`pa-table` inputs: `columns` (grid-template-columns), `noHeader`, `border`, `noAutoColumnStyle`.

Sortable header:
```html
<pa-table-sortable-header
  [cells]="headerCells"
  [menuColumn]="true"
  (sort)="onSort($event)">
</pa-table-sortable-header>
```
`headerCells: HeaderCell[]` — each has `{ id, label, sortable, active, direction }`.

Multi-line lead cell:
```html
<pa-table-lead-cell-multi-line>
  <pa-table-lead-image><img [src]="item.img" /></pa-table-lead-image>
  <pa-table-lead-title>{{ item.name }}</pa-table-lead-title>
  <pa-table-lead-description>{{ item.description }}</pa-table-lead-description>
</pa-table-lead-cell-multi-line>
```

### Chips — `PaChipsModule`

All chip variants share base inputs: `avatar`, `icon`, `value`, `backgroundColor`, `textColor`, `borderColor`, `disabled`.

| Component | Selector | Extra |
|-----------|----------|-------|
| `pa-chip` | Display only | — |
| `pa-chip-closeable` | With × | input `readonly`; output `closed: {event, value}` |
| `pa-chip-selectionable` | Toggle select | input `selected`; output `select` |
| `pa-chip-expandable` | Expandable | output `expanded: {event, value}` |

```html
<pa-chip-closeable [value]="tag" (closed)="removeTag($event.value)">{{ tag }}</pa-chip-closeable>
```

### Avatar — `PaAvatarModule`

```html
<pa-avatar [avatar]="{ userName: 'John Doe', size: 'medium', autoBackground: true }"></pa-avatar>
```

`AvatarModel`: `{ userName?, userId?, imageSrc?, size?, image?: Observable<Blob>, autoBackground? }`.  
Sizes: `'tiny' | 'small' | 'medium' | 'huge'`.

### Avatar Pile — `PaAvatarPileModule`

```html
<pa-avatar-pile [avatars]="members" (clickOnMore)="showAll()"></pa-avatar-pile>
```

---

## Utility

### Tooltip — `PaTooltipModule`

```html
<!-- Simple tooltip -->
<span [paTooltip]="'Tooltip text'">Hover me</span>

<!-- Ellipsis tooltip — shows only when text is truncated -->
<span paEllipsisTooltip>Very long text that may overflow</span>
```

### Infinite Scroll — `PaScrollModule`

```html
<pa-infinite-scroll (reachAnchor)="loadMore()">
  <div *ngFor="let item of items">{{ item.name }}</div>
</pa-infinite-scroll>
```

Uses `IntersectionObserver` internally. Emits `reachAnchor` when bottom sentinel enters view.

### `[scrollableContainer]` — `PaScrollModule`

Marks a container as the scroll parent for `InfiniteScrollComponent`.

### Translate — `PaTranslateModule`

```html
{{ 'resource.delete.confirm' | translate }}
{{ 'resource.count' | translate : { count: 5 } }}
<span [translate]="'resource.title'"></span>
```

Setup (once at module root):
```ts
PaTranslateModule.addTranslations([{ en_US: myTranslations }])
// + provider: { provide: PA_LANG, useValue: 'en_US' }
```

All Pastanaga internal strings use `pastanaga.` prefix — override in `addTranslations`.

### `BreakpointObserver` — service

```ts
private bp = inject(BreakpointObserver);

mode$ = this.bp.currentMode; // Observable<'desktop' | 'tablet' | 'mobile'>
```

Breakpoints: mobile < 600px, tablet 600–1023px, desktop ≥ 1024px.

### `[paFocusable]` — `PaFocusableModule`

Keyboard-only focus ring. Applied internally to all Pastanaga interactive elements.
Apply to custom focusable elements to get system-consistent focus styling.

---

## Common Types

```ts
type Kind       = 'primary' | 'secondary' | 'inverted' | 'destructive';
type Size       = 'small' | 'medium' | 'large' | 'xlarge' | 'xxlarge';
type Aspect     = 'solid' | 'basic';
type ViewportMode = 'desktop' | 'tablet' | 'mobile';

// Utility functions (from lib/common):
trimString(value: string | null | undefined): string
markForCheck(cdr: ChangeDetectorRef): void   // safely; checks if view is destroyed
detectChanges(cdr: ChangeDetectorRef): void  // safely; checks if view is destroyed
getScrollableParent(el: HTMLElement): HTMLElement
```

---

## Module → Component map

| Module | Key exports |
|--------|-------------|
| `PaButtonModule` | `pa-button` |
| `PaIconModule` | `pa-icon` |
| `PaCardModule` | `pa-card` |
| `PaChipsModule` | `pa-chip`, `pa-chip-closeable`, `pa-chip-selectionable`, `pa-chip-expandable` |
| `PaTextFieldModule` | `pa-input`, `pa-textarea`, `pa-select`, `pa-typeahead-select`, `[nativeTextField]`, `pa-option`, `pa-option-header`, `pa-separator` |
| `PaTogglesModule` | `pa-checkbox`, `pa-toggle`, `pa-radio`, `[paRadioGroup]` |
| `PaSliderModule` | `pa-slider` |
| `PaDropdownModule` | `pa-dropdown`, `pa-option`, `pa-option-header`, `pa-separator` |
| `PaPopupModule` | `pa-popup`, `[paPopup]`, `pa-popover`, `[paPopover]` |
| `PaModalModule` | `pa-modal-dialog`, `pa-modal-advanced`, `pa-modal-title`, `pa-modal-content`, `pa-modal-footer`, `pa-modal-description`, `pa-modal-image` |
| `PaToastModule` | `pa-toast` (declare once per app) |
| `PaExpanderModule` | `pa-expander`, `[pa-expander-header]`, `[pa-expander-body]`, `[pa-expander-header-side-block]` |
| `PaTableModule` | `pa-table`, `pa-table-row`, `pa-table-row-header`, `pa-table-cell`, `pa-table-cell-menu`, `pa-table-lead-cell-multi-line`, `pa-table-sortable-header`, `pa-table-sortable-header-cell` |
| `PaTabsModule` | `pa-tabs`, `pa-tab` |
| `PaScrollModule` | `pa-infinite-scroll`, `[scrollableContainer]` |
| `PaSideNavModule` | `pa-side-nav`, `pa-side-nav-item`, slot directives |
| `PaAvatarModule` | `pa-avatar` |
| `PaAvatarPileModule` | `pa-avatar-pile` |
| `PaTooltipModule` | `[paTooltip]`, `[paEllipsisTooltip]` |
| `PaTranslateModule` | `translate` pipe, `[translate]` directive |
| `PaDatePickerModule` | `pa-date-picker` |
| `PaDateTimeModule` | `pa-datetime` |
| `PaFocusableModule` | `[paFocusable]` |
| Standalone | `AccordionComponent`, `AccordionItemComponent` |
