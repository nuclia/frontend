import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';
import { BrnResizableGroup } from '@spartan-ng/brain/resizable';

@Directive({
  selector: '[hlmResizableGroup],hlm-resizable-group',
  exportAs: 'hlmResizableGroup',
  hostDirectives: [
    {
      directive: BrnResizableGroup,
      inputs: ['direction', 'layout'],
      outputs: ['dragEnd', 'dragStart', 'layoutChange'],
    },
  ],
  host: {
    'data-slot': 'resizable-group',
  },
})
export class HlmResizableGroup {
  constructor() {
    classes(() => 'group flex h-full w-full data-[panel-group-direction=vertical]:flex-col');
  }
}
