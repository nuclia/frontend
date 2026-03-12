# Design Tokens Reference

Covers both Pastanaga base tokens and Sistema overrides.  
**Two layers:**
1. CSS custom properties (`:root` — runtime-overridable)
2. SCSS variables — compile-time only; override via `@forward … with()`

---

## How Tokens Flow

```
libs/pastanaga-angular/src/styles/theme/  ← base SCSS token files
        ↓ @forward…with() in sistema/theme/tokens/
libs/sistema/theme/tokens/                ← overrides
        ↓ @forward all of the above
libs/sistema/styles/_overrides.scss       ← single barrel for apps to @use
```

App global `styles.scss`:
```scss
@use '@nuclia/sistema/styles/apps-common';  // emits :root CSS vars + utility classes
@use 'path/to/pastanaga-angular/src/styles/core';  // CSS reset + typography
```

---

## Colour Palette

### CSS Custom Properties (`:root`, runtime-overridable)

#### Sistema brand palette (overrides Pastanaga defaults)

```css
/* Primary — brand blue */
--color-primary-stronger:  hsl(252, 100%, 24%)    /* very dark blue */
--color-primary-strong:    #0037CB                /* dark blue */
--color-primary-regular:   #054BFF                /* brand blue */
--color-primary-light:     hsl(252, 100%, 73%)
--color-primary-lighter:   #dcecff
--color-primary-lightest:  #eef5ff

/* Secondary — yellow/warning */
--color-secondary-stronger: hsl(49, 100%, 30%)
--color-secondary-strong:   hsl(49, 100%, 40%)
--color-secondary-regular:  hsl(49, 100%, 60%)    /* main warning yellow */
--color-secondary-light:    hsl(49, 100%, 80%)
--color-secondary-lighter:  hsl(49, 100%, 90%)
--color-secondary-lightest: hsl(49, 100%, 95%)

/* Tertiary — not widely used in Sistema */
--color-tertiary-stronger / strong / regular / light / lighter / lightest

/* Neutrals */
--color-dark-stronger:      #000
--color-light-stronger:     #fff
--color-neutral-regular:    hsl(0, 0%, 44%)
--color-neutral-light:      hsl(0, 0%, 77%)
--color-neutral-lighter:    hsl(0, 0%, 90%)
--color-neutral-lightest:   hsl(240, 7%, 97%)

/* Semi-transparent (used for overlays) */
--color-neutral-inverted-default:  hsla(0,0%,100%,0.5)
--color-neutral-inverted-light:    hsla(0,0%,100%,0.25)
--color-neutral-inverted-lighter:  hsla(0,0%,100%,0.15)
--color-neutral-inverted-lightest: hsla(0,0%,100%,0.05)
```

#### White-label override hooks

```css
--custom-color-primary-stronger   /* → replaces --color-primary-stronger */
--custom-color-primary-strong
--custom-color-primary-regular
--custom-color-primary-light
--custom-color-primary-lighter
--custom-color-primary-lightest
--custom-color-neutral-regular
--custom-color-neutral-light
--custom-color-neutral-lighter
--custom-color-neutral-lightest
--custom-font-family               /* → replaces font stack */
--custom-topbar-logo-width         /* → sidebar logo area width */
```

---

## Shadows

| Token | Value |
|-------|-------|
| `--shadow-small` | `none` (Sistema override) |
| `--shadow-default` | `0px 1px 8px rgba(0,0,0,.12), 0px 0px 4px rgba(0,0,0,.1)` |
| `--shadow-medium` | `0px 8px 16px rgba(0,0,0,.18), 0px 0px 4px rgba(0,0,0,.1)` |
| `--shadow-large` | `0px 12px 40px rgba(0,0,0,.24), 0px 0px 4px rgba(0,0,0,.1)` |

SCSS: `$shadow-focus: …` (pink focus ring — `rgba(255,117,172,0.6)`), `$shadow-modal`, `$shadow-focus-checkbox`.

---

## Typography

```scss
// SCSS (use via includePaths alias "variables"):
$font-family-sans-serif: var(--custom-font-family, Roboto)
$font-family-monospace: 'Source Code Pro'
$font-weight-regular: 400
$font-weight-semi-bold: 600
$font-weight-bold: 700

// Font sizes (SCSS $font-size map):
font-size(xxs) = 0.625rem  (10px)
font-size(xs)  = 0.75rem   (12px)
font-size(s)   = 0.875rem  (14px)  ← body/button default
font-size(m)   = 1rem      (16px)
font-size(l)   = 1.125rem  (18px)
font-size(xl)  = 1.25rem   (20px)
font-size(xxl) = 1.5rem    (24px)
font-size(d1)  = 1.375rem  display small
font-size(d2)  = 1.75rem   display medium
font-size(d3)  = 2.25rem   display large
```

CSS custom properties:
```css
--font-size-xxs: 0.625rem  --font-size-xs: 0.75rem  --font-size-s: 0.875rem
--font-size-m: 1rem        --font-size-l: 1.125rem  --font-size-xl: 1.25rem
--font-size-xxl: 1.5rem
--line-height-s: 1rem      --line-height-m: 1.25rem  --line-height-l: 1.5rem
--line-height-xl: 1.75rem  --line-height-xxl: 2rem
```

---

## Spacing & Layout (SCSS only)

```scss
// Base unit:
$spacer: 0.5rem  // = 8px

// rhythm() function — primary sizing utility:
rhythm(0)  = 0        rhythm(0.5) = 4px    rhythm(1)   = 8px
rhythm(1.5)= 12px     rhythm(2)   = 16px   rhythm(2.5) = 20px
rhythm(3)  = 24px     rhythm(4)   = 32px   rhythm(5)   = 40px
rhythm(6)  = 48px     rhythm(7)   = 56px   rhythm(8)   = 64px
rhythm(9)  = 72px     rhythm(12)  = 96px   rhythm(16)  = 128px
rhythm(20) = 160px    rhythm(26)  = 208px  rhythm(56)  = 448px

// Layout constants (from _variables.scss):
$height-top-bar:       rhythm(9)   // 72px — matches --app-topbar-height
$width-sidenav:        rhythm(26)  // 208px
$padding-left-page:    rhythm(6)   // 48px
$padding-right-page:   rhythm(4)   // 32px
$padding-top-page:     rhythm(4)   // 32px
$padding-bottom-page:  rhythm(4)   // 32px
$scrollbar-width:      rhythm(2)   // 16px

// Borders:
$border-radius-default:    0.25rem  // 4px — buttons, inputs
$border-radius-container:  0.5rem   // 8px — cards, modals

// Breakpoints:
$size-viewport-wide-min:    2000px
$width-large-screen:        1024px
$height-viewport-medium-min: 800px
$height-viewport-medium-max: 799px
```

---

## Z-Index Stack

```scss
$z-index-toast:           10000    // Sistema override (base = 800)
$z-index-modal-backdrop:  9999     // Sistema override (base = 590)
$z-index-tooltip:         1200
$z-index-alert:           1000
$z-index-modal:           600
$z-index-popup:           400
$z-index-default:         1
$z-index-background:     -50
$z-index-deepdive:       -100
```

---

## Button Tokens (Sistema overrides)

> All are SCSS compile-time vars (no runtime CSS custom properties for buttons).

| Aspect | Sizes |
|--------|-------|
| Height small | `rhythm(4)` = 32px |
| Height medium | `rhythm(5)` = 40px |
| Height large | `rhythm(6)` = 48px |
| Font size medium/large | `font-size(s)` = 14px |
| Border radius | `$border-radius-default` = 4px |

**Primary solid:**
- Default bg: `$color-primary-regular` (#054BFF), text: white
- Hover bg: `$color-primary-strong` (#0037CB)
- Active bg: `$color-primary-stronger`
- Disabled bg: `$color-neutral-lighter`, text: white

**Secondary solid:**
- Default bg: `$color-dark-stronger` (black), text: white
- Hover bg: `$color-neutral-regular`
- Active bg: `$color-neutral-regular`

**Destructive solid:**
- Default bg: `$color-secondary-regular` (yellow), text: `$color-dark-stronger`
- Hover bg: `$color-secondary-strong`

**All variants: no box-shadow** (flat design).

---

## Textfield / Input Tokens

```scss
$margin-bottom-field: 0                         // no bottom margin
$height-control: calc(rhythm(5) - rhythm(0.25)) // ~38px
$padding-top-control: rhythm(1)                 // 8px

// Borders:
$color-border-field-regular: $color-neutral-light
$color-border-field-hover:   $color-neutral-regular
$color-border-field-error:   $color-secondary-regular

// Backgrounds:
$color-background-field-regular: $color-light-stronger  // white
$color-background-field-error:   $color-secondary-lightest

// Labels:
$color-label-field-error: $color-secondary-stronger
$font-weight-label:       $font-weight-regular  // 400 (not bold)

// Label float Y translate:
$translate-y-label: rhythm(3)  // 24px
```

---

## Table Tokens

```scss
// Row sizing:
$min-height-table-cell:     rhythm(5)           // 40px
$padding-table-cell-medium: rhythm(0.5) rhythm(2) // 4px 16px

// Colours:
$color-text-table-header:   $color-dark-stronger
$color-text-table-cell:     $color-dark-stronger
$color-border-table-header: $color-neutral-light
$color-border-table-row:    $color-neutral-lighter
$color-background-table-header: $color-neutral-lightest
$color-background-table-header-row: $color-light-stronger

// Typography:
$text-transform-table-header: none
```

---

## Tabs Tokens

```scss
$color-text-tab-link:              $color-dark-stronger
$color-background-tab-active:     $color-neutral-lightest
$color-background-tab-inactive:   $color-light-stronger
$color-tab-slider:                 $color-neutral-lighter
$font-size-tab:                    font-size(m)       // 16px
$font-weight-tab-active:           $font-weight-semi-bold  // 600
$font-weight-tab-inactive:         $font-weight-regular    // 400
$padding-tab-medium:               rhythm(1.5) rhythm(3)   // 12px 24px
$text-transform-tab:               none
```

---

## Toast Tokens (Sistema overrides Pastanaga)

| Type | Background | Text |
|------|-----------|------|
| success | `$color-neutral-lighter` | `$color-dark-stronger` |
| info | `$color-neutral-lighter` | `$color-dark-stronger` |
| warning | `$color-dark-stronger` (black) | `$color-light-stronger` (white) |
| error | `$color-secondary-regular` (yellow) | `$color-dark-stronger` |

```scss
$min-width-toast: rhythm(56)         // 448px
$padding-toast:   rhythm(1.5) rhythm(2) // 12px 16px
```

---

## Toggle / Checkbox / Radio Tokens

```scss
// Checkbox/radio checked:
$color-background-checkbox-selected: $color-dark-stronger  // black
$color-background-checkbox-selected-hover: $color-neutral-regular

// Toggle slider:
$color-toggle-slider-selected: $color-primary-regular  // #054BFF
$color-toggle-slider-selected-hover: $color-primary-strong

// Disabled:
$color-background-toggle-disabled: $color-neutral-lighter
```

---

## Modal Tokens

```scss
$width-confirm-dialog: rhythm(56)  // 448px
// backdrop: rgba(0,0,0,0.5) default
```

---

## Expander Tokens (folded/expanded states)

```scss
$color-background-expander-header-collapsed:       $color-neutral-lightest
$color-background-expander-header-collapsed-hover: $color-neutral-lighter
$color-background-expander-header-expanded:        $color-neutral-lighter
$color-expander-header-shadow-collapsed: inset 0 -1px 0 $color-neutral-lighter
// All text: $color-dark-stronger
```

---

## Chips Tokens

```scss
$border-radius-chip:         $border-radius-default       // 4px
$font-size-chip:             font-size(xs)                // 12px
$padding-chip:               rhythm(0.5) rhythm(1)        // 4px 8px
$color-background-chip-default-selected: $color-neutral-lightest
$border-chip-selected: 1px solid $color-dark-stronger
```

---

## Card Tokens

```scss
$border-radius-card: rhythm(1)  // 8px
```

---

## Scrollbar Tokens

```scss
$scrollbar-width:        rhythm(1)   // 8px
$border-radius-scrollbar: 0          // flat, no rounding
$color-thumb-scrollbar:  $color-dark-stronger  // black thumb
// Track: transparent
```

Use `@include scrollbar-black($bg: #fff)` for consistent black scrollbar.

---

## Menu / Dropdown Tokens

```scss
$color-text-menu-option-destructive:           $color-secondary-stronger (dark yellow)
$color-background-menu-option-destructive-hover:  $color-secondary-lightest
$color-background-menu-option-destructive-active: $color-secondary-lighter
$color-border-menu-separator: $color-neutral-lighter
```

---

## Popover / Tooltip Tokens

```scss
// Popover (floating help panel):
$color-background-popover: $color-dark-stronger  // black
$color-text-popover: $color-neutral-lightest

// Tooltip: same as popover (dark background)
```

---

## App-Level CSS Variables (from `_apps-common.scss`)

These are emitted to `:root` and used by apps:

```css
--app-background-color:        var(--color-light-stronger)
--app-topbar-height:           72px
--app-layout-padding-bottom:   32px
--app-layout-padding-left:     48px
--app-layout-padding-right:    32px
--app-layout-padding-top:      32px
--app-zindex-topbar:           1000
--app-topbar-logo-width:       var(--custom-topbar-logo-width, 128px)
```

---

## Utility CSS Classes (from `_apps-common.scss`)

Full list with notes:

| Class | SCSS definition |
|-------|----------------|
| `.page-spacing` | `min-height: calc(100vh - var(--app-topbar-height)); padding: var(--app-layout-padding-top) var(--app-layout-padding-right) var(--app-layout-padding-bottom) var(--app-layout-padding-left)` |
| `.page-spacing .page-title` | `display-s()` mixin typography, block display |
| `.page-spacing .page-description` | `font-size(s)`, `color: $color-neutral-regular` |
| `.form-container` | `display: flex; flex-direction: column; gap: rhythm(2)` |
| `.form-container.small-gap` | `gap: rhythm(1.5)` |
| `.inline-form` | `display: flex; flex-direction: row; gap: rhythm(2); align-items: flex-start` |
| `.inline-form.full-width` | `width: 100%` |
| `.inline-form.small-gap` | `gap: rhythm(1.5)` |
| `.container-with-border` | `border: 1px solid $color-neutral-lighter; border-radius: $border-radius-default; padding: rhythm(2)` |
| `.separator-line` | `height: 1px; background: $color-neutral-lighter; margin: 0` |
| `.separator-word` | `text-transform: lowercase; color: $color-neutral-regular; font-size: font-size(s)` |
| `a.accent-link` | `color: $color-text-link-accent (#054BFF); text-decoration: none; hover: underline` |
| `.nsi-list` | Styled `<ul>` — each `<li>` has hover bg, hidden `.actions` appearing on hover |
| `.close-button` | `position: absolute; top: rhythm(1); right: rhythm(1)` |
| `pa-tab.unauthorized` | `opacity: 0.4; pointer-events: none; cursor: default` |
| `pa-radio.unauthorized` / `pa-checkbox.unauthorized` / `pa-toggle.unauthorized` | Locked state with lock icon |
| `.beta-option` | Beta feature row, constrained radio/toggle width |
| `.pa-modal .pa-modal-footer.pa-dual-buttons` | `justify-content: center; & pa-button { min-width: rhythm(16) }` |

---

## SCSS Mixins (from `_mixins.scss`)

```scss
@use 'variables' as v;

// Dark mode section:
@include v.dark-mode() {
  // Sets background: $color-dark-stronger; color: $color-light-stronger
}

// Strip browser button styles:
button {
  @include v.reset-button();
}

// Truncate long text with ellipsis:
.my-cell {
  @include v.text-truncate();
}

// Full custom scrollbar:
@include v.scrollbar-style(
  $size: 8px,
  $background-color: #fff,
  $background-hover-color: #f5f5f5,
  $thumb-color: #000,
  $thumb-active-color: #333,
  $border-radius: 0,
  $border: 2px
);

// Black thin scrollbar (most common):
.scrollable-area {
  @include v.scrollbar-black($bg: #fff);
}
```
