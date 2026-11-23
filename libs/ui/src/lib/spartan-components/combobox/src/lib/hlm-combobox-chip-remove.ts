import { Directive } from '@angular/core';
import { buttonVariants } from '@progress/pdp-ui-spartan/button';
import { classes } from '@progress/pdp-ui-spartan/utils';
import { BrnComboboxChipRemove } from '@spartan-ng/brain/combobox';

@Directive({
  selector: 'button[hlmComboboxChipRemove]',
  exportAs: 'hlmComboboxChipRemove',
  hostDirectives: [BrnComboboxChipRemove],
  host: { 'data-slot': 'combobox-chip-remove' },
})
export class HlmComboboxChipRemove {
  constructor() {
    classes(() => ['-ms-1 opacity-50 hover:opacity-100', buttonVariants({ variant: 'ghost', size: 'icon-xs' })]);
  }
}
