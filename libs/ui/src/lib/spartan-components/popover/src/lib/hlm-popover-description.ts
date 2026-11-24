// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmPopoverDescription]',
  exportAs: 'hlmPopoverDescription',
  host: { 'data-slot': 'popover-description' },
})
export class HlmPopoverDescription {
  constructor() {
    classes(() => 'text-muted-foreground');
  }
}
