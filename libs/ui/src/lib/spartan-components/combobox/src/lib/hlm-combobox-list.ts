import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';
import { BrnComboboxList } from '@spartan-ng/brain/combobox';

@Directive({
  selector: '[hlmComboboxList]',
  exportAs: 'hlmComboboxList',
  hostDirectives: [{ directive: BrnComboboxList, inputs: ['id'] }],
  host: { 'data-slot': 'combobox-list' },
})
export class HlmComboboxList {
  constructor() {
    classes(
      () =>
        'no-scrollbar max-h-[calc(--spacing(72)---spacing(9))] scroll-py-1 p-1 data-empty:p-0 overflow-y-auto overscroll-contain',
    );
  }
}
