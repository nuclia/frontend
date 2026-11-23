import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';
import { BrnNavigationMenuItem } from '@spartan-ng/brain/navigation-menu';

@Directive({
  selector: 'li[hlmNavigationMenuItem]',
  exportAs: 'hlmNavigationMenuItem',
  hostDirectives: [{ directive: BrnNavigationMenuItem, inputs: ['id'] }],
  host: {
    'data-slot': 'navigation-menu-item',
  },
})
export class HlmNavigationMenuItem {
  constructor() {
    classes(() => 'relative has-[:focus]:z-10 data-active:z-10');
  }
}
