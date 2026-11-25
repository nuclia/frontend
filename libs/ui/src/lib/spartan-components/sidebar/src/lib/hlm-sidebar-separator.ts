// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { HlmSeparator } from '@progress/pdp-ui-spartan/separator';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmSidebarSeparator],hlm-sidebar-separator',
  exportAs: 'hlmSidebarSeparator',
  hostDirectives: [HlmSeparator],
  host: {
    'data-slot': 'sidebar-separator',
    'data-sidebar': 'separator',
  },
})
export class HlmSidebarSeparator {
  constructor() {
    classes(() => 'bg-sidebar-border mx-2 w-auto');
  }
}
