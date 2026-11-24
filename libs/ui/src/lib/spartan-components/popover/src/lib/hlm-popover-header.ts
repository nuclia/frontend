// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmPopoverHeader],hlm-popover-header',
  exportAs: 'hlmPopoverHeader',
  host: { 'data-slot': 'popover-header' },
})
export class HlmPopoverHeader {
  constructor() {
    classes(() => 'flex flex-col gap-0.5 text-sm');
  }
}
