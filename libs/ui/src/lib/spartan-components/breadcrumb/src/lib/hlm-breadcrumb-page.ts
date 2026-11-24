// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmBreadcrumbPage]',
  exportAs: 'hlmBreadcrumbPage',
  host: {
    'data-slot': 'breadcrumb-page',
    role: 'link',
    'aria-disabled': 'true',
    'aria-current': 'page',
  },
})
export class HlmBreadcrumbPage {
  constructor() {
    classes(() => 'text-foreground font-normal');
  }
}
