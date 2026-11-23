import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';
import { BrnDialogTitle } from '@spartan-ng/brain/dialog';

@Directive({
  selector: '[hlmDialogTitle]',
  exportAs: 'hlmDialogTitle',
  hostDirectives: [BrnDialogTitle],
  host: { 'data-slot': 'dialog-title' },
})
export class HlmDialogTitle {
  constructor() {
    classes(() => 'text-base leading-none font-medium');
  }
}
