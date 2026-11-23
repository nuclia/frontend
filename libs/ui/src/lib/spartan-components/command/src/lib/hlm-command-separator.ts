import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';
import { BrnCommandSeparator } from '@spartan-ng/brain/command';

@Directive({
  selector: '[hlmCommandSeparator],hlm-command-separator',
  exportAs: 'hlmCommandSeparator',
  hostDirectives: [BrnCommandSeparator],
  host: {
    'data-slot': 'command-separator',
  },
})
export class HlmCommandSeparator {
  constructor() {
    classes(() => 'bg-border -mx-1 h-px block data-hidden:hidden');
  }
}
