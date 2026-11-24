// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: 'div[hlmSidebarGroupContent]',
  exportAs: 'hlmSidebarGroupContent',
  host: {
    'data-slot': 'sidebar-group-content',
    'data-sidebar': 'group-content',
  },
})
export class HlmSidebarGroupContent {
  constructor() {
    classes(() => 'text-sm w-full');
  }
}
