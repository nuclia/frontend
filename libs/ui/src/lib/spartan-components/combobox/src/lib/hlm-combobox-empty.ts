import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';
import { BrnComboboxEmpty } from '@spartan-ng/brain/combobox';

@Directive({
  selector: '[hlmComboboxEmpty],hlm-combobox-empty',
  exportAs: 'hlmComboboxEmpty',
  hostDirectives: [BrnComboboxEmpty],
  host: { 'data-slot': 'combobox-empty' },
})
export class HlmComboboxEmpty {
  constructor() {
    classes(
      () =>
        'text-muted-foreground hidden w-full items-center justify-center py-2 text-center text-sm group-data-empty/combobox-content:flex',
    );
  }
}
