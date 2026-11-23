import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';
import { BrnNavigationMenu } from '@spartan-ng/brain/navigation-menu';

@Directive({
  selector: 'nav[hlmNavigationMenu]',
  exportAs: 'hlmNavigationMenu',
  hostDirectives: [
    {
      directive: BrnNavigationMenu,
      inputs: ['value', 'delayDuration', 'skipDelayDuration', 'orientation', 'openOn'],
      outputs: ['valueChange'],
    },
  ],
  host: {
    'data-slot': 'navigation-menu',
  },
})
export class HlmNavigationMenu {
  constructor() {
    classes(() => 'group/navigation-menu relative flex max-w-max flex-1 items-center justify-center');
  }
}
