// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmEmptyTitle]',
  exportAs: 'hlmEmptyTitle',
  host: { 'data-slot': 'empty-title' },
})
export class HlmEmptyTitle {
  constructor() {
    classes(() => 'text-sm font-medium tracking-tight');
  }
}
