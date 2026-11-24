// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: 'li[hlmSidebarMenuItem]',
  exportAs: 'hlmSidebarMenuItem',
  host: {
    'data-slot': 'sidebar-menu-item',
    'data-sidebar': 'menu-item',
  },
})
export class HlmSidebarMenuItem {
  constructor() {
    classes(() => 'group/menu-item relative');
  }
}
