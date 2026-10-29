import { Directive } from '@angular/core';
import { BrnDrawerTitle } from '@spartan-ng/brain/drawer';
import { classes } from '@nuclia/ui-spartan/utils';

@Directive({
  selector: '[hlmDrawerTitle]',
  hostDirectives: [BrnDrawerTitle],
  host: { 'data-slot': 'drawer-title' },
})
export class HlmDrawerTitle {
  constructor() {
    classes(() => 'text-foreground text-base font-medium');
  }
}
