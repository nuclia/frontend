// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { BrnAccordionItem } from '@spartan-ng/brain/accordion';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmAccordionItem],hlm-accordion-item',
  exportAs: 'hlmAccordionItem',
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
