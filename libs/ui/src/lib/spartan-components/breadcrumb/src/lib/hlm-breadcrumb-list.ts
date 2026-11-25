// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmBreadcrumbList]',
  exportAs: 'hlmBreadcrumbList',
  host: {
    'data-slot': 'breadcrumb-list',
  },
})
export class HlmBreadcrumbList {
  constructor() {
    classes(
      () =>
        'text-muted-foreground gap-1.5 text-sm flex flex-wrap items-center wrap-break-word',
    );
  }
}
