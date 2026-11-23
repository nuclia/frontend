import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';
import { BrnAlertDialogTitle } from '@spartan-ng/brain/alert-dialog';

@Directive({
  selector: '[hlmAlertDialogTitle]',
  exportAs: 'hlmAlertDialogTitle',
  hostDirectives: [BrnAlertDialogTitle],
  host: { 'data-slot': 'alert-dialog-title' },
})
export class HlmAlertDialogTitle {
  constructor() {
    classes(
      () =>
        'text-base font-medium sm:group-data-[size=default]/alert-dialog-content:group-has-data-[slot=alert-dialog-media]/alert-dialog-content:col-start-2',
    );
  }
}
