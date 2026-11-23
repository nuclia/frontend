import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';
import { BrnComboboxSeparator } from '@spartan-ng/brain/combobox';

@Directive({
  selector: '[hlmComboboxSeparator]',
  exportAs: 'hlmComboboxSeparator',
  hostDirectives: [{ directive: BrnComboboxSeparator, inputs: ['orientation'] }],
  host: { 'data-slot': 'combobox-separator' },
})
export class HlmComboboxSeparator {
  constructor() {
    classes(() => 'bg-border -mx-1 my-1 h-px');
  }
}
