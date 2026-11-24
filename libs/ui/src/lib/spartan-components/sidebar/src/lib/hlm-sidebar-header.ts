// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmSidebarHeader],hlm-sidebar-header',
  exportAs: 'hlmSidebarHeader',
  host: {
    'data-slot': 'sidebar-header',
    'data-sidebar': 'header',
  },
})
export class HlmSidebarHeader {
  constructor() {
    classes(() => 'gap-2 p-2 flex flex-col');
  }
}
