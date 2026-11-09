import { Directive } from '@angular/core';
import { classes } from '@nuclia/ui-spartan/utils';

@Directive({
  selector: '[hlmPopoverDescription]',
  exportAs: 'hlmPopoverDescription',
  host: { 'data-slot': 'popover-description' },
})
export class HlmPopoverDescription {
  constructor() {
    classes(() => 'text-muted-foreground');
  }
}
