import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';
import { BrnAutocompleteLabel } from '@spartan-ng/brain/autocomplete';

@Directive({
  selector: '[hlmAutocompleteLabel]',
  exportAs: 'hlmAutocompleteLabel',
  hostDirectives: [{ directive: BrnAutocompleteLabel, inputs: ['id'] }],
  host: { 'data-slot': 'autocomplete-label' },
})
export class HlmAutocompleteLabel {
  constructor() {
    classes(() => 'text-muted-foreground px-2 py-1.5 text-xs');
  }
}
