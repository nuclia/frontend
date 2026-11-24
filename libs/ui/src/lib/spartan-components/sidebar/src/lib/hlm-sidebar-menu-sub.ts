// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: 'ul[hlmSidebarMenuSub]',
  exportAs: 'hlmSidebarMenuSub',
  host: {
    'data-slot': 'sidebar-menu-sub',
    'data-sidebar': 'menu-sub',
  },
})
export class HlmSidebarMenuSub {
  constructor() {
    classes(
      () =>
        'border-sidebar-border mx-3.5 translate-x-px gap-1 border-s px-2.5 py-0.5 group-data-[collapsible=icon]:hidden rtl:-translate-x-px flex min-w-0 flex-col',
    );
  }
}
