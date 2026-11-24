// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: 'li[hlmSidebarMenuSubItem]',
  exportAs: 'hlmSidebarMenuSubItem',
  host: {
    'data-slot': 'sidebar-menu-sub-item',
    'data-sidebar': 'menu-sub-item',
  },
})
export class HlmSidebarMenuSubItem {
  constructor() {
    classes(() => 'group/menu-sub-item relative');
  }
}
