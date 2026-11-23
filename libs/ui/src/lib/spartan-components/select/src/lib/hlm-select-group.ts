import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';
import { BrnSelectGroup } from '@spartan-ng/brain/select';

@Directive({
  selector: '[hlmSelectGroup],hlm-select-group',
  exportAs: 'hlmSelectGroup',
  hostDirectives: [{ directive: BrnSelectGroup }],
  host: { 'data-slot': 'select-group' },
})
export class HlmSelectGroup {
  constructor() {
    classes(() => 'scroll-my-1 p-1');
  }
}
