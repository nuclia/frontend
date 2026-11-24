// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { BrnCollapsibleContent } from '@spartan-ng/brain/collapsible';
import { classes } from '@progress/pdp-ui-spartan/utils';

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
