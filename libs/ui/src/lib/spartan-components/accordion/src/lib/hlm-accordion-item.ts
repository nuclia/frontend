import { Directive } from '@angular/core';
import { classes } from '@nuclia/ui-spartan/utils';
import { BrnAccordionItem } from '@spartan-ng/brain/accordion';

@Directive({
  selector: '[hlmAccordionItem],hlm-accordion-item',
  hostDirectives: [
    {
      directive: BrnAccordionItem,
      inputs: ['isOpened', 'disabled'],
      outputs: ['openedChange'],
    },
  ],
  host: {
    'data-slot': 'accordion-item',
  },
})
export class HlmAccordionItem {
  constructor() {
    classes(() => 'not-last:border-b flex flex-col');
  }
}
