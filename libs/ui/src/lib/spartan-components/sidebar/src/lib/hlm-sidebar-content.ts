// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmSidebarContent],hlm-sidebar-content',
  exportAs: 'hlmSidebarContent',
  host: {
    'data-slot': 'sidebar-content',
    'data-sidebar': 'content',
  },
})
export class HlmSidebarContent {
  constructor() {
    classes(
      () =>
        'no-scrollbar gap-0 flex min-h-0 flex-1 flex-col overflow-auto group-data-[collapsible=icon]:overflow-hidden',
    );
  }
}
