import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';
import { BrnAutocompleteList } from '@spartan-ng/brain/autocomplete';

@Directive({
  selector: '[hlmAutocompleteList]',
  exportAs: 'hlmAutocompleteList',
  hostDirectives: [{ directive: BrnAutocompleteList, inputs: ['id', 'aria-label', 'aria-labelledby'] }],
  host: { 'data-slot': 'autocomplete-list' },
})
export class HlmAutocompleteList {
  constructor() {
    classes(
      () =>
        'no-scrollbar max-h-[calc(--spacing(72)---spacing(9))] scroll-py-1 p-1 data-empty:p-0 overflow-y-auto overscroll-contain',
    );
  }
}
