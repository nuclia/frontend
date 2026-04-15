---
name: design-system
description: >
  Expert knowledge of the Nuclia design system — @nuclia/sistema and @guillotinaweb/pastanaga-angular.
  Use this skill whenever a task involves ANY of the following: creating or modifying Angular UI
  components in dashboard, rao, manager-v2, or nucliadb-admin; using or overriding design tokens
  (colours, spacing, typography); adding icons, modals, toasts, dropdowns, tables, tabs, form fields,
  or any pa-/nsi- prefixed component; styling with SCSS tokens or utility classes; implementing
  settings pages, configuration rows, cards, badges, labels, progress indicators, or navigation
  elements. Don't wait to be asked explicitly about design system — if the task is about frontend UI
  in this monorepo, this skill applies.
---

# Nuclia Design System — Quick Reference

## Architecture

```
@guillotinaweb/pastanaga-angular  ← base (pa- prefix, NgModule-based, general UI)
        ↓ theme overrides via SCSS @forward…with()
@nuclia/sistema                   ← Nuclia layer (nsi- prefix, mostly standalone)
        ↓ import in apps
dashboard / rao / manager-v2 / nucliadb-admin
```

**Key rule:** Always prefer `SisModalService` / `SisToastService` (from `@nuclia/sistema`) over the
raw Pastanaga equivalents. They apply opinionated defaults (`cancelAspect: 'basic'`, toast titles).

---

## Mandatory: Demo Page for Every Sistema Component

> **Whenever a component is added to or updated in `@nuclia/sistema`, a corresponding demo page
> in `apps/sistema-demo` must also be added or updated.**

Demo pages live in `apps/sistema-demo/src/app/sistema-pages/`. Follow this checklist:

### 1 — Create the demo folder

Create `sistema-pages/<component-name>/` with these files:

**`<component-name>.component.ts`**

```ts
@Component({
  selector: 'nsd-sistema-<name>',
  templateUrl: './<component-name>.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,           // ← always false in this module
})
export class Sistema<Name>DemoComponent { ... }
```

**`<component-name>.component.html`** — uses the `pa-demo-*` DSL:

```html
<pa-demo-page>
  <pa-demo-title>Component Name</pa-demo-title>
  <pa-demo-description>
    <p>Brief description of what the component does.</p>
  </pa-demo-description>

  <pa-demo-examples>
    <!-- live interactive examples -->
  </pa-demo-examples>

  <pa-demo-code>
    <!-- copyable code snippets -->
    <pre><code>{{ codeSnippet }}</code></pre>
  </pa-demo-code>
</pa-demo-page>
```

Add `<component-name>.component.scss` only when additional demo-page styles are needed.

### 2 — Register in `sistema-pages.module.ts`

In `apps/sistema-demo/src/app/sistema-pages/sistema-pages.module.ts`:

- Add the demo component class to `declarations`
- Add any new `NsiXxxComponent` (or module) from `@nuclia/sistema` to `imports`

### 3 — Export from `index.ts`

Add a barrel export to `apps/sistema-demo/src/app/sistema-pages/index.ts`:

```ts
export * from './sistema-<name>/sistema-<name>.component';
```

### 4 — Register in the app menu

In `apps/sistema-demo/src/app/app.component.ts`, add an entry to the `menu` array under the
`'Nuclia Sistema'` section, keeping **alphabetical order by `title`**:

```ts
{ path: 'sistema-<name>', title: '<Display Name>' }
```

### Reference example

`apps/sistema-demo/src/app/sistema-pages/sistema-spinner/` is the canonical minimal example
(no SCSS needed, single component, three size variants shown in `pa-demo-examples` +
`pa-demo-code`).

---

## SCSS Setup (every app's global styles)

```scss
// styles.scss
@use '@nuclia/sistema/styles/apps-common'; // layout CSS vars, base body, all utility classes
@use 'path/to/pastanaga-angular/src/styles/core'; // Pastanaga reset + typography

// _variables.scss (component-level)
@forward '@nuclia/sistema/styles/variables'; // tokens + mixins
```

In component `.scss` files bind to tokens via the `includePaths` alias:

```scss
@use 'variables' as v;
// then use v.$height-top-bar, v.rhythm(4), etc.
```

---

## TypeScript Imports Cheat-Sheet

```ts
// Sistema standalone components (import directly):
import {
  BadgeComponent,
  StatusComponent,
  BackButtonComponent,
  ButtonMiniComponent,
  DropdownButtonComponent,
  SegmentedButtonsComponent,
  SearchInputComponent,
  ExpandableTextareaComponent,
  ActionCardComponent,
  InfoCardComponent,
  FolderListComponent,
  FolderTreeComponent,
  HomeContainerComponent,
  StickyFooterComponent,
  TwoColumnsConfigurationItemComponent,
  ProgressBarComponent,
  JsonViewerComponent,
  LabelsExpanderComponent,
  StandaloneMimeIconPipe,
} from '@nuclia/sistema';

// Sistema NgModules (non-standalone legacy):
import { SisLabelModule, SisPasswordInputModule, SisProgressModule } from '@nuclia/sistema';

// Sistema services (providedIn: 'root' — inject, don't provide):
import { SisModalService, SisToastService } from '@nuclia/sistema';

// Pastanaga modules (NgModule-based):
import {
  PaButtonModule,
  PaIconModule,
  PaTableModule,
  PaTabsModule,
  PaTextFieldModule,
  PaTogglesModule,
  PaDropdownModule,
  PaModalModule,
  PaExpanderModule,
  PaChipsModule,
  PaScrollModule,
  PaCardModule,
  PaAvatarModule,
  PaPopupModule,
  PaTranslateModule,
  PaTooltipModule,
} from '@guillotinaweb/pastanaga-angular';

// Pastanaga standalone — accordion only:
import { AccordionComponent, AccordionItemComponent } from '@guillotinaweb/pastanaga-angular';

// Pastanaga services:
import { ModalService, ToastService, BreakpointObserver } from '@guillotinaweb/pastanaga-angular';

// Pastanaga types:
import {
  Kind,
  Size,
  Aspect,
  ViewportMode,
  ModalRef,
  ModalConfig,
  ConfirmationData,
  ToastConfig,
  AvatarModel,
} from '@guillotinaweb/pastanaga-angular';
```

---

## Services

### `SisModalService` — openModal / openConfirm

```ts
// Inject:
private modalService = inject(SisModalService);

// Open a custom component as a modal:
const ref: ModalRef = this.modalService.openModal(MyDialogComponent, new ModalConfig({ data: { id: '123' } }));
ref.onClose.subscribe(result => { /* result from ref.close(value) */ });

// Confirmation dialog:
this.modalService.openConfirm({
  title: 'Delete this resource?',
  description: 'This cannot be undone.',
  isDestructive: true,
  confirmLabel: 'Delete',           // optional, defaults to 'Yes'
  cancelLabel: 'Cancel',            // optional
}).onClose.subscribe(confirmed => { if (confirmed) this.doDelete(); });
```

Custom modal component pattern:

```ts
@Component({
  template: `
    <pa-modal-dialog>
      <pa-modal-title>My Title</pa-modal-title>
      <pa-modal-content>{{ modal.config.data.id }}</pa-modal-content>
      <pa-modal-footer>
        <pa-button (click)="modal.close(true)">OK</pa-button>
        <pa-button
          aspect="basic"
          (click)="modal.dismiss()">
          Cancel
        </pa-button>
      </pa-modal-footer>
    </pa-modal-dialog>
  `,
})
export class MyDialogComponent extends BaseModalComponent {
  constructor(
    public override ref: ModalRef,
    protected override cdr: ChangeDetectorRef,
  ) {
    super(ref, cdr);
  }
}
```

> Import `BaseModalComponent`, `ModalRef`, `ModalConfig`, `PaModalModule` from `@guillotinaweb/pastanaga-angular`.

---

### `SisToastService` — 4 methods

```ts
private toast = inject(SisToastService);

this.toast.success('Resource saved successfully.');
this.toast.error('Something went wrong.');
this.toast.warning('Quota is running low.');
this.toast.info('Processing started in background.');
```

Each method auto-sets title, icon, and `closeButtonConf`. Never use `ToastService` directly — use `SisToastService`.

---

## Icons

Always use `<pa-icon name="GLYPH_NAME">`. There are ~110 glyphs in `libs/sistema/glyphs/`.

Key icon names:

```
arrow-left  arrow-right  arrow-up  arrow-down
check  circle-check  circle-dash  cross
warning  info  question
add  remove  edit  delete  copy  download  upload
eye  eye-closed  lock  unlock  settings
search  filter  sort
file  file-pdf  file-empty  spreadsheet  image  play  audio  chat  link
folder  home  account  agent  clock  calendar
star  heart  tag  label  book
chevron-right  chevron-left  chevron-up  chevron-down
more-options  close  expand  collapse
```

> Register the sprite once per app: `AngularSvgIconModule.forRoot()` in the root module,
> and include `assets/glyphs-sprite.svg` in `angular.json` assets.

For file-type icons, use the `mimeIcon` pipe: `{{ mimeType | mimeIcon }}` or `StandaloneMimeIconPipe`.

---

## Utility CSS Classes (from `_apps-common.scss` / `styles.scss`)

| Class                                                                           | Usage                                                               |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `.page-spacing`                                                                 | Full-page container with topbar-aware min-height and layout padding |
| `.page-title`                                                                   | Inside `.page-spacing` — heading row using display-small typography |
| `.page-description`                                                             | Inside `.page-spacing` — muted body text below title                |
| `.form-container`                                                               | `flex column gap-16` — wraps a form's fields                        |
| `.form-container.small-gap`                                                     | Same but `gap-12`                                                   |
| `.inline-form`                                                                  | `flex row gap-16` — side-by-side fields                             |
| `.inline-form.full-width`                                                       | Stretches to 100% width                                             |
| `.container-with-border`                                                        | Rounded bordered box with `padding: 16px`                           |
| `.separator-line`                                                               | 1px `$color-neutral-lighter` horizontal divider                     |
| `.separator-word`                                                               | Lowercase grey text separator (e.g. "or")                           |
| `a.accent-link`                                                                 | Blue text link using `$color-text-link-accent`                      |
| `.nsi-list`                                                                     | Styled list — hover states + hidden action buttons on hover         |
| `.close-button`                                                                 | Absolute top-right close button                                     |
| `.pa-modal .pa-modal-footer.pa-dual-buttons`                                    | Centred dual-button modal footer                                    |
| `pa-tab.unauthorized`                                                           | Faded, non-interactive locked tab                                   |
| `pa-radio.unauthorized` / `pa-checkbox.unauthorized` / `pa-toggle.unauthorized` | Locked controls                                                     |

---

## Typography Tokens (CSS custom properties)

```css
--font-family-sans-serif   /* Poppins / Roboto (white-labeled via --custom-font-family) */
--font-family-monospace    /* Source Code Pro */

--font-size-xxs   /* 10px (0.625rem) */
--font-size-xs    /* 12px (0.75rem) */
--font-size-s     /* 14px (0.875rem) */   ← body default
--font-size-m     /* 16px (1rem) */
--font-size-l     /* 18px (1.125rem) */
--font-size-xl    /* 20px (1.25rem) */
--font-size-xxl   /* 24px (1.5rem) */

--font-weight-thin         /* 300 */
--font-weight-regular      /* 400 */
--font-weight-semi-bold    /* 500–600 (varies by context) */
--font-weight-bold         /* 700 */

--line-height-s   /* 16px */   --line-height-m   /* 20px */
--line-height-l   /* 24px */   --line-height-xl  /* 28px */
--line-height-xxl /* 32px */
```

---

## Colour Palette (CSS custom properties)

Brand tokens — override any via `--custom-color-*` hooks in app global styles:

```css
/* Primary (blue in default Pastanaga; brand blue #054BFF in Sistema) */
--color-primary-stronger   --color-primary-strong   --color-primary-regular
--color-primary-light      --color-primary-lighter  --color-primary-lightest

/* Secondary (yellow/warning) */
--color-secondary-stronger  ...  --color-secondary-lightest

/* Tertiary (green/success) */
--color-tertiary-stronger   ...  --color-tertiary-lightest

/* Neutrals */
--color-dark-stronger   /* #000 */    --color-light-stronger  /* #fff */
--color-neutral-regular  --color-neutral-light  --color-neutral-lighter  --color-neutral-lightest

/* Shadows */
--shadow-small  --shadow-default  --shadow-medium  --shadow-large
```

**Critical rule: Never hardcode colour hex values (`#666`, `#ccc`, `#f0f0f0`, `#999`, etc.) in
component SCSS.** Always use theme variables:

- `$color-neutral-regular` for muted text / axis labels
- `$color-neutral-light` for borders, tick lines, secondary fills
- `$color-neutral-lighter` for dividers, light borders
- `$color-neutral-lightest` for backgrounds, grid lines
- `$color-primary-regular` for interactive / accent elements
- `$color-light-stronger` for text on dark backgrounds

White-label override hooks:

```css
--custom-color-primary-regular   /* override brand primary */
--custom-font-family             /* override font */
--custom-topbar-logo-width       /* override logo area width */
```

---

## Spacing (SCSS)

```scss
// Base: $spacer = 0.5rem (8px)
// rhythm(N) = N * 0.5rem — main sizing utility
rhythm(1) = 8px    rhythm(2) = 16px   rhythm(3) = 24px   rhythm(4) = 32px
rhythm(5) = 40px   rhythm(6) = 48px   rhythm(8) = 64px   rhythm(9) = 72px

// Key layout SCSS vars (from $variables.scss):
$height-top-bar: rhythm(9)     // 72px
$width-sidenav:  rhythm(26)    // 208px
$padding-left-page: rhythm(6)  // 48px
$padding-right-page: rhythm(4) // 32px
$padding-top-page: rhythm(4)   // 32px
$border-radius-default: 0.25rem
$border-radius-card: rhythm(1)  // 8px
```

**Critical rule: Never use hardcoded `px` values for spacing (gap, margin, padding, width, height).
Always use `rhythm(N)`.** For example:

- `gap: rhythm(3)` not `gap: 24px`
- `margin-bottom: rhythm(2)` not `margin-bottom: 16px`
- `padding: rhythm(1) rhythm(2)` not `padding: 8px 16px`

To use `rhythm()` in a component SCSS, import the variables:

```scss
@use 'apps/dashboard/src/variables' as *;
// then rhythm(N), $color-*, $font-size-*, etc. are all available
```

---

## Z-Index Stack (SCSS)

```scss
$z-index-toast:           10000
$z-index-modal-backdrop:  9999
$z-index-tooltip:         1200
$z-index-alert:           1000
$z-index-modal:           600
$z-index-popup:           400
$z-index-default:         1
$z-index-background:     -50
$z-index-deepdive:       -100
```

---

## SCSS Mixins (from `_mixins.scss`)

```scss
@include dark-mode() // dark bg + light text
  @include reset-button() // strip browser button styles
  @include text-truncate() // ellipsis overflow
  @include scrollbar-style($size, $bg, $bg-hover, $thumb, $thumb-active, $radius, $border) @include
  scrollbar-black($bg: #fff); // shortcut: thin black scrollbar
```

---

## Reference Files (load when needed)

> These files contain the **complete API** for every component. Load the relevant one before
> implementing any feature that involves those components.

| File                                 | Contents                                                                                                                                    |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `references/sistema-components.md`   | All 22 `nsi-*` components — selector, inputs, outputs, module, snippet                                                                      |
| `references/pastanaga-components.md` | All `pa-*` components grouped by category                                                                                                   |
| `references/tokens.md`               | Complete token reference — palette, buttons, table, tabs, textfield, toasts, toggle, shadows, scrollbar, expander, modal, menu, chips, card |
| `references/patterns.md`             | Complete working code recipes for common patterns (modal, toast, settings page layout, table, form, dropdown, tabs)                         |

**When to load which file:**

- Adding a new `nsi-*` component → `sistema-components.md`
- Adding a `pa-button`, `pa-input`, `pa-table`, `pa-modal`, etc. → `pastanaga-components.md`
- Overriding colours, spacing, or component styles via SCSS → `tokens.md`
- Implementing a common UI pattern (settings row, confirmation flow, sorted table) → `patterns.md`
