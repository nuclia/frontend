import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmPopoverTitle]',
  exportAs: 'hlmPopoverTitle',
  host: { 'data-slot': 'popover-title' },
})
export class HlmPopoverTitle {
  constructor() {
    classes(() => 'font-medium');
  }
}
