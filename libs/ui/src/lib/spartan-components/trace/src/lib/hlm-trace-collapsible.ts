// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { BrnCollapsible } from '@spartan-ng/brain/collapsible';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmTraceCollapsible],hlm-trace-collapsible',
  exportAs: 'hlmTraceCollapsible',
  hostDirectives: [
    {
      directive: BrnCollapsible,
      inputs: ['expanded', 'disabled'],
      outputs: ['expandedChange'],
    },
  ],
  host: { 'data-slot': 'trace-collapsible' },
})
export class HlmTraceCollapsible {
  constructor() {
    classes(() => 'flex w-full min-w-0 flex-col');
  }
}
