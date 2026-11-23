import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';
import { BrnCommand } from '@spartan-ng/brain/command';

@Directive({
  selector: '[hlmCommand],hlm-command',
  exportAs: 'hlmCommand',
  hostDirectives: [
    {
      directive: BrnCommand,
      inputs: ['id', 'filter', 'search', 'disabled'],
      outputs: ['valueChange', 'searchChange'],
    },
  ],
  host: {
    'data-slot': 'command',
  },
})
export class HlmCommand {
  constructor() {
    classes(() => 'bg-popover text-popover-foreground rounded-xl p-1 flex size-full flex-col overflow-hidden');
  }
}
