import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';
import { BrnSheetDescription } from '@spartan-ng/brain/sheet';

@Directive({
  selector: '[hlmSheetDescription]',
  exportAs: 'hlmSheetDescription',
  hostDirectives: [BrnSheetDescription],
  host: { 'data-slot': 'sheet-description' },
})
export class HlmSheetDescription {
  constructor() {
    classes(() => 'text-muted-foreground text-sm');
  }
}
