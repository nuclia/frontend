import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';
import { BrnCommandList } from '@spartan-ng/brain/command';

@Directive({
  selector: '[hlmCommandList],hlm-command-list',
  exportAs: 'hlmCommandList',
  hostDirectives: [
    {
      directive: BrnCommandList,
      inputs: ['id'],
    },
  ],
  host: {
    'data-slot': 'command-list',
  },
})
export class HlmCommandList {
  constructor() {
    classes(() => 'no-scrollbar max-h-72 scroll-py-1 outline-none overflow-x-hidden overflow-y-auto');
  }
}
