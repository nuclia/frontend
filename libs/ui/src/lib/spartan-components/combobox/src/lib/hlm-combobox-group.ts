import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';
import { BrnComboboxGroup } from '@spartan-ng/brain/combobox';

@Directive({
  selector: '[hlmComboboxGroup]',
  exportAs: 'hlmComboboxGroup',
  hostDirectives: [BrnComboboxGroup],
  host: { 'data-slot': 'combobox-group' },
})
export class HlmComboboxGroup {
  constructor() {
    classes(() => 'data-hidden:hidden');
  }
}
