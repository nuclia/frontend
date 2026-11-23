import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';
import { BrnDrawerTitle } from '@spartan-ng/brain/drawer';

@Directive({
  selector: '[hlmDrawerTitle]',
  exportAs: 'hlmDrawerTitle',
  hostDirectives: [BrnDrawerTitle],
  host: { 'data-slot': 'drawer-title' },
})
export class HlmDrawerTitle {
  constructor() {
    classes(() => 'text-foreground text-base font-medium');
  }
}
