// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmSheetHeader],hlm-sheet-header',
  exportAs: 'hlmSheetHeader',
  host: { 'data-slot': 'sheet-header' },
})
export class HlmSheetHeader {
  constructor() {
    classes(() => 'gap-0.5 p-4 flex flex-col');
  }
}
