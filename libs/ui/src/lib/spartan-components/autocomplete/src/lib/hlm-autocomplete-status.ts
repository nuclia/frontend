import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';
import { BrnAutocompleteStatus } from '@spartan-ng/brain/autocomplete';

@Directive({
  selector: '[hlmAutocompleteStatus],hlm-autocomplete-status',
  exportAs: 'hlmAutocompleteStatus',
  hostDirectives: [BrnAutocompleteStatus],
  host: { 'data-slot': 'autocomplete-status' },
})
export class HlmAutocompleteStatus {
  constructor() {
    classes(
      () => 'text-muted-foreground gap-2 px-2.5 py-2 text-sm flex w-full items-center justify-center text-center',
    );
  }
}
