import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';
import { BrnSelectPlaceholder } from '@spartan-ng/brain/select';

@Directive({
  selector: '[hlmSelectPlaceholder],hlm-select-placeholder',
  exportAs: 'hlmSelectPlaceholder',
  hostDirectives: [BrnSelectPlaceholder],
  host: { 'data-slot': 'select-placeholder' },
})
export class HlmSelectPlaceholder {
  constructor() {
    classes(
      () =>
        "gap-2 [&_ng-icon:not([class*='text-'])]:text-[length:--spacing(4)] flex items-center data-hidden:hidden [&_ng-icon]:pointer-events-none [&_ng-icon]:shrink-0",
    );
  }
}
