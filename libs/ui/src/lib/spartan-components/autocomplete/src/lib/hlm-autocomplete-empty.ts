import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';
import { BrnAutocompleteEmpty } from '@spartan-ng/brain/autocomplete';

@Directive({
  selector: '[hlmAutocompleteEmpty],hlm-autocomplete-empty',
  exportAs: 'hlmAutocompleteEmpty',
  hostDirectives: [BrnAutocompleteEmpty],
  host: { 'data-slot': 'autocomplete-empty' },
})
export class HlmAutocompleteEmpty {
  constructor() {
    classes(
      () =>
        'text-muted-foreground hidden w-full items-center justify-center py-2 text-center text-sm group-data-empty/autocomplete-content:flex',
    );
  }
}
