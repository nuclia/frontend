// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmSheetFooter],hlm-sheet-footer',
  exportAs: 'hlmSheetFooter',
  host: { 'data-slot': 'sheet-footer' },
})
export class HlmSheetFooter {
  constructor() {
    classes(() => 'gap-2 p-4 mt-auto flex flex-col');
  }
}
