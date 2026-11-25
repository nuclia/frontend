// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { BrnAccordion } from '@spartan-ng/brain/accordion';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmAccordion], hlm-accordion',
  exportAs: 'hlmAccordion',
  hostDirectives: [
    { directive: BrnAccordion, inputs: ['type', 'orientation'] },
  ],
  host: {
    'data-slot': 'accordion',
  },
})
export class HlmAccordion {
  constructor() {
    classes(() => 'flex w-full flex-col');
  }
}
