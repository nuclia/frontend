import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';
import { BrnNavigationMenuList } from '@spartan-ng/brain/navigation-menu';

@Directive({
  selector: 'ul[hlmNavigationMenuList]',
  exportAs: 'hlmNavigationMenuList',
  hostDirectives: [
    {
      directive: BrnNavigationMenuList,
    },
  ],
  host: {
    'data-slot': 'navigation-menu-list',
  },
})
export class HlmNavigationMenuList {
  constructor() {
    classes(() => [
      'gap-0 group flex flex-1 list-none items-center justify-center',
      'data-[orientation=vertical]:flex-col',
    ]);
  }
}
