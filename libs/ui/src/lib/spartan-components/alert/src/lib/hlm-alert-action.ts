import { Directive } from '@angular/core';
import { classes } from '@nuclia/ui-spartan/utils';

@Directive({
  selector: '[hlmAlertAction]',
  host: {
    'data-slot': 'alert-action',
  },
})
export class HlmAlertAction {
  constructor() {
    classes(() => 'absolute end-2 top-2');
  }
}
