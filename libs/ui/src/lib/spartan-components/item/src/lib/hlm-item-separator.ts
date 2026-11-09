import { Directive } from '@angular/core';
import { BrnSeparator } from '@spartan-ng/brain/separator';
import { hlmSeparatorClass } from '@nuclia/ui-spartan/separator';
import { classes } from '@nuclia/ui-spartan/utils';

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
