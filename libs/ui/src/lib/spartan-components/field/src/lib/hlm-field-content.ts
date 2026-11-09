import { Directive } from '@angular/core';
import { classes } from '@nuclia/ui-spartan/utils';

@Directive({
  selector: '[hlmFieldContent],hlm-field-content',
  exportAs: 'hlmFieldContent',
  host: { 'data-slot': 'field-content' },
})
export class HlmFieldContent {
  constructor() {
    classes(() => 'gap-0.5 group/field-content flex flex-1 flex-col leading-snug');
  }
}
