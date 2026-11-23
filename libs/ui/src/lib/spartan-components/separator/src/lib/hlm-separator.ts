import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';
import { BrnSeparator } from '@spartan-ng/brain/separator';

export const hlmSeparatorClass =
  'inline-flex shrink-0 bg-border data-horizontal:h-px data-horizontal:w-full data-vertical:w-px data-vertical:self-stretch';

@Directive({
  selector: '[hlmSeparator],hlm-separator',
  exportAs: 'hlmSeparator',
  hostDirectives: [{ directive: BrnSeparator, inputs: ['orientation', 'decorative'] }],
  host: {
    'data-slot': 'separator',
  },
})
export class HlmSeparator {
  constructor() {
    classes(() => hlmSeparatorClass);
  }
}
