import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';
import { BrnAutocompleteSeparator } from '@spartan-ng/brain/autocomplete';

@Directive({
  selector: '[hlmAutocompleteSeparator]',
  exportAs: 'hlmAutocompleteSeparator',
  hostDirectives: [{ directive: BrnAutocompleteSeparator, inputs: ['orientation'] }],
  host: { 'data-slot': 'autocomplete-separator' },
})
export class HlmAutocompleteSeparator {
  constructor() {
    classes(() => 'bg-border -mx-1 my-1 h-px');
  }
}
