import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';
import { BrnSheetTitle } from '@spartan-ng/brain/sheet';

@Directive({
  selector: '[hlmSheetTitle]',
  exportAs: 'hlmSheetTitle',
  hostDirectives: [BrnSheetTitle],
  host: { 'data-slot': 'sheet-title' },
})
export class HlmSheetTitle {
  constructor() {
    classes(() => 'text-foreground text-base font-medium');
  }
}
