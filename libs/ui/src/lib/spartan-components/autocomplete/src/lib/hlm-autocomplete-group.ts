import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';
import { BrnAutocompleteGroup } from '@spartan-ng/brain/autocomplete';

@Directive({
  selector: '[hlmAutocompleteGroup]',
  exportAs: 'hlmAutocompleteGroup',
  hostDirectives: [BrnAutocompleteGroup],
  host: { 'data-slot': 'autocomplete-group' },
})
export class HlmAutocompleteGroup {
  constructor() {
    classes(() => 'data-hidden:hidden');
  }
}
