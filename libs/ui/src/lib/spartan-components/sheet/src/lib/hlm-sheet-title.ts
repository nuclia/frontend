// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { BrnSheetTitle } from '@spartan-ng/brain/sheet';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmSheetTitle]',
  exportAs: 'hlmSheetTitle',
  hostDirectives: [BrnSheetTitle],
  host: { 'data-slot': 'sheet-title' },
})
export class HlmSheetTitle {
  constructor() {
    classes(() => 'text-foreground text-base font-medium');
  }
}
