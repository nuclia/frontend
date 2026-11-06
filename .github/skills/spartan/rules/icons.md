# Icons

spartan/ui renders icons with [`@ng-icons`](https://ng-icons.github.io/ng-icons). This workspace uses
rounded Material Icons (`@ng-icons/material-icons/round`) by default. Import icons from the `/round`
entrypoint, not the package root, and use their `mat...Round` names.

## Choosing icons

Browse [the catalog](https://ng-icons.github.io/ng-icons/browse?sets=material-icons) and **select only the
`round` variant** in its filters (it shows `baseline`, `outline` and `sharp` by default; those have different
shapes and names). The exported name is `mat<Name>Round`.

Confirm an icon exists before using it, e.g. `node --input-type=module -e "const i = await
import('@ng-icons/material-icons/round'); console.log(Object.keys(i).filter(n => /Chevron/.test(n)))"`.
A name matching is not proof the shape fits the role - check the catalog preview for unfamiliar picks.

Preferred icons for common roles (keep these consistent across components):

| Role                    | Icon                                                |
| ----------------------- | --------------------------------------------------- |
| Close / dismiss         | `matCloseRound`                                     |
| Check / selected        | `matCheckRound`                                     |
| Dropdown / expand       | `matKeyboardArrowDownRound` / `...UpRound`          |
| Previous / next         | `matChevronLeftRound` / `matChevronRightRound`      |
| Sortable select trigger | `matUnfoldMoreRound`                                |
| Info / success          | `matInfoRound` / `matCheckCircleRound`              |
| Warning / error         | `matWarningRound` / `matDangerousRound`             |
| Loading (spinner)       | `matDataUsageRound` (spun via `animate-spin`)       |
| Delete / edit           | `matDeleteRound` / `matEditRound`                   |
| Search / add / remove   | `matSearchRound` / `matAddRound` / `matRemoveRound` |

## The element

Icons are an `<ng-icon>` element with the `name`:

```html
<ng-icon name="matChevronRightRound" />
```

## Register every icon

Icon names are not global - each icon you reference must be provided to the component (or app) via
`provideIcons`. Import the symbol from its set and register it:

```ts
import { Component } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { matChevronRightRound, matDeleteRound } from '@ng-icons/material-icons/round';

@Component({
  selector: 'app-example',
  imports: [NgIcon],
  providers: [provideIcons({ matChevronRightRound })],
  template: `
    <ng-icon name="matChevronRightRound" />
  `,
})
export class ExampleComponent {}
```

If an icon does not render, the usual cause is a missing `provideIcons` entry.

For free-standing decorative icons you may set color with a semantic class
(`class="text-muted-foreground"`).

## Sizing

`<ng-icon>` inherits its size from the font size of its parent. Use a Tailwind font-size utility to scale it, following the spacing scale:

```html
<ng-icon
  name="matChevronRightRound"
  class="text-[length:--spacing(4)]" />
```

## Installing the icon component

The upstream Spartan CLI hardcodes its original icon set; it has no icon-set configuration option.
After generating a component, replace its icon imports, registrations, template names and default
inputs with rounded Material equivalents. Keep `@ng-icons/core` and `@ng-icons/material-icons` as
the workspace dependencies; do not retain the generator's original icon package.
