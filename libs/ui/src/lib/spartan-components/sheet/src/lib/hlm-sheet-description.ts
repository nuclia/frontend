import { Directive } from '@angular/core';
import { BrnSheetDescription } from '@spartan-ng/brain/sheet';
import { classes } from '@nuclia/ui-spartan/utils';

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
