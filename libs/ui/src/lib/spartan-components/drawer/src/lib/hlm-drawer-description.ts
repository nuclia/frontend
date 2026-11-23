import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';
import { BrnDrawerDescription } from '@spartan-ng/brain/drawer';

@Directive({
  selector: '[hlmDrawerDescription]',
  exportAs: 'hlmDrawerDescription',
  hostDirectives: [BrnDrawerDescription],
  host: { 'data-slot': 'drawer-description' },
})
export class HlmDrawerDescription {
  constructor() {
    classes(() => 'text-muted-foreground text-sm');
  }
}
