// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { BrnCollapsible } from '@spartan-ng/brain/collapsible';

@Directive({
  selector: '[hlmCollapsible],hlm-collapsible',
  exportAs: 'hlmCollapsible',
  hostDirectives: [
    {
      directive: BrnCollapsible,
      inputs: ['expanded', 'disabled'],
      outputs: ['expandedChange'],
    },
  ],
  host: { 'data-slot': 'collapsible' },
})
export class HlmCollapsible {}
