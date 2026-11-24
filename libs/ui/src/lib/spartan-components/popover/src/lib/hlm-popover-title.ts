// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmPopoverTitle]',
  exportAs: 'hlmPopoverTitle',
  host: { 'data-slot': 'popover-title' },
})
export class HlmPopoverTitle {
  constructor() {
    classes(() => 'font-medium');
  }
}
