import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';
import { BrnComboboxStatus } from '@spartan-ng/brain/combobox';

@Directive({
  selector: '[hlmComboboxStatus],hlm-combobox-status',
  exportAs: 'hlmComboboxStatus',
  hostDirectives: [BrnComboboxStatus],
  host: { 'data-slot': 'combobox-status' },
})
export class HlmComboboxStatus {
  constructor() {
    classes(
      () => 'text-muted-foreground gap-2 px-2.5 py-2 text-sm flex w-full items-center justify-center text-center',
    );
  }
}
