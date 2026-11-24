// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: 'ul[hlmPaginationContent]',
  exportAs: 'hlmPaginationContent',
  host: { 'data-slot': 'pagination-content' },
})
export class HlmPaginationContent {
  constructor() {
    classes(() => 'gap-0.5 flex items-center');
  }
}
