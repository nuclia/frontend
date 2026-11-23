import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';
import { BrnSelectLabel } from '@spartan-ng/brain/select';

@Directive({
  selector: '[hlmSelectLabel],hlm-select-label',
  exportAs: 'hlmSelectLabel',
  hostDirectives: [{ directive: BrnSelectLabel, inputs: ['id'] }],
  host: { 'data-slot': 'select-label' },
})
export class HlmSelectLabel {
  constructor() {
    classes(() => 'text-muted-foreground px-1.5 py-1 text-xs flex');
  }
}
