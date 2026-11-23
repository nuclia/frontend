import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';
import { BrnComboboxLabel } from '@spartan-ng/brain/combobox';

@Directive({
  selector: '[hlmComboboxLabel]',
  exportAs: 'hlmComboboxLabel',
  hostDirectives: [{ directive: BrnComboboxLabel, inputs: ['id'] }],
  host: { 'data-slot': 'combobox-label' },
})
export class HlmComboboxLabel {
  constructor() {
    classes(() => 'text-muted-foreground px-2 py-1.5 text-xs');
  }
}
