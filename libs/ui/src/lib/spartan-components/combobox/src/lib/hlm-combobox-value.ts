import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';
import { BrnComboboxValue } from '@spartan-ng/brain/combobox';

@Directive({
  selector: '[hlmComboboxValue],hlm-combobox-value',
  exportAs: 'hlmComboboxValue',
  hostDirectives: [{ directive: BrnComboboxValue, inputs: ['placeholder'] }],
  host: { 'data-slot': 'combobox-value' },
})
export class HlmComboboxValue {
  constructor() {
    classes(() => 'data-hidden:hidden');
  }
}
