// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: 'ul[hlmSidebarMenu]',
  exportAs: 'hlmSidebarMenu',
  host: {
    'data-slot': 'sidebar-menu',
    'data-sidebar': 'menu',
  },
})
export class HlmSidebarMenu {
  constructor() {
    classes(() => 'gap-0 flex w-full min-w-0 flex-col');
  }
}
