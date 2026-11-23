import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';
import { BrnCollapsibleContent } from '@spartan-ng/brain/collapsible';

@Directive({
  selector: '[hlmCollapsibleContent],hlm-collapsible-content',
  exportAs: 'hlmCollapsibleContent',
  hostDirectives: [{ directive: BrnCollapsibleContent, inputs: ['id'] }],
  host: { 'data-slot': 'collapsible-content' },
})
export class HlmCollapsibleContent {
  constructor() {
    classes(() => 'data-[state=closed]:hidden');
  }
}
