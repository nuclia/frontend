import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';
import { BrnComboboxPlaceholder } from '@spartan-ng/brain/combobox';

@Directive({
  selector: '[hlmComboboxPlaceholder],hlm-combobox-placeholder',
  exportAs: 'hlmComboboxPlaceholder',
  hostDirectives: [BrnComboboxPlaceholder],
  host: { 'data-slot': 'combobox-placeholder' },
})
export class HlmComboboxPlaceholder {
  constructor() {
    classes(
      () =>
        "gap-2 [&_ng-icon:not([class*='text-'])]:text-[length:--spacing(4)] flex items-center data-hidden:hidden [&_ng-icon]:pointer-events-none [&_ng-icon]:shrink-0",
    );
  }
}
