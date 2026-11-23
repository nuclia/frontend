import { Directive } from '@angular/core';
import { hlmSeparatorClass } from '@progress/pdp-ui-spartan/separator';
import { classes } from '@progress/pdp-ui-spartan/utils';
import { BrnSeparator } from '@spartan-ng/brain/separator';

@Directive({
  selector: '[hlmItemSeparator],hlm-item-separator',
  exportAs: 'hlmItemSeparator',
  hostDirectives: [{ directive: BrnSeparator, inputs: ['orientation'] }],
  host: { 'data-slot': 'item-separator' },
})
export class HlmItemSeparator {
  constructor() {
    classes(() => [hlmSeparatorClass, 'my-2']);
  }
}
