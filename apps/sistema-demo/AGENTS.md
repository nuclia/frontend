# AGENTS.md — Sistema Demo

## App Overview

`sistema-demo` is a **live interactive showcase** for `libs/sistema`. It demonstrates every UI component, token, and theme customisation that Sistema provides. Not a production app — purely a developer/designer reference tool.

Tech stack: **Angular 21** (NgModule-based with some standalone) · `@guillotinaweb/pastanaga-angular` · `PaDemoModule` · `PaTranslateModule`.

---

## Project Structure

```
apps/sistema-demo/src/
├── styles.scss                          # imports sistema + pastanaga core
├── _variables.scss                      # forwards libs/sistema/styles/variables
├── pastanaga-core-overrides.scss        # sistema theme overrides for pa-core
├── pastanaga-component-overrides.scss   # sistema theme overrides for pa-components
├── environments/
└── app/
    ├── app.module.ts           # Root NgModule; menu array drives routing
    ├── app-routing.module.ts   # Routes auto-derived from menu array in AppComponent
    ├── app.component.ts        # Root; `menu` array defines all component demos
    ├── sistema-pages/          # All nsi-* component demo pages
    │   ├── pastanaga-pages-override/  # Overrides for Pastanaga component demos
    │   └── index.ts
    └── vendors/                # Pastanaga demo pages included directly
```

---

## Routing

Routes are auto-derived from the `menu` array in `app.component.ts` — **no `app-routing.module.ts` edits needed when adding new demos**.

Top-level route groups: `Sistema Components`, `Sistema Services`, `Pastanaga Overrides`.

Includes a demo page for `nsi-country-select` (added in `sistema-pages/`).

---

## Component Quick Reference

All demo pages follow the `<pa-demo-page>` scaffold:
```html
<pa-demo-page>
  <pa-demo-title>…</pa-demo-title>
  <pa-demo-description>…</pa-demo-description>
  <pa-demo-examples>…</pa-demo-examples>
  <pa-demo-usage>…</pa-demo-usage>
  <pa-demo-code>…</pa-demo-code>
</pa-demo-page>
```

Components to demo reside in `src/app/sistema-pages/<name>/` and are registered in the `menu` array.

---

## Adding a New Component Demo

1. Generate: `nx g @nx/angular:component` targeting `sistema-demo`.
2. Place in `src/app/sistema-pages/<name>/`.
3. Export from `src/app/sistema-pages/index.ts`.
4. Import in `app.component.ts` and add entry to `menu`:
   ```ts
   { view: 'my-component', title: 'My Component', type: MyComponentDemoComponent }
   ```
   Routes are auto-derived — no routing changes needed.

To **override a Pastanaga demo**, create a wrapper under `sistema-pages/pastanaga-pages-override/` and reference it in the `menu` array instead of the original.

---

## SCSS

```scss
// styles.scss
@use '../../../libs/sistema/styles/apps-common';
@use '../../../libs/pastanaga-angular/.../core';

// _variables.scss (via includePaths)
@forward '../../../libs/sistema/styles/variables';
```

Customise theming via CSS `--custom-*` hooks on `:root`. Never fork token files.

---

## Run Commands

```bash
nx serve sistema-demo    # dev server
nx build sistema-demo    # dist/apps/sistema-demo/ (baseHref: /frontend/)
nx test sistema-demo     # Jest (minimal tests — real tests are in nx test sistema)
nx test sistema          # Run to verify design system components
nx lint sistema-demo
```

---

## Important Conventions

1. **Component prefix `nsd`** — all demo app components use `<nsd-root>` etc. Sistema lib uses `nsi-`.
2. **`inlineStyle: true`, `skipTests: true`** — generator defaults in `project.json`.
3. **Routes auto-derived from menu** — edit only `app.component.ts` `menu` array to add/remove demo pages.
4. **`PaDemoModule` scaffold** — every demo page uses `<pa-demo-page>` slots. Do not create custom layouts.
5. **i18n via `PaTranslateModule`** — default `en_US`; `latin` test locale available. Add translations via `addTranslations` in `AppModule`.
6. **Assets** — SVG sprite at `libs/sistema/assets/glyphs-sprite.svg`; loaded via `angular-svg-icon`.
7. **Production base href** — `baseHref: /frontend/` in production build config.
8. **Overriding Pastanaga demos** — use `sistema-pages/pastanaga-pages-override/`; register in `menu` to replace the default Pastanaga demo page.
