// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { BrnSheetDescription } from '@spartan-ng/brain/sheet';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmSheetDescription]',
  exportAs: 'hlmSheetDescription',
  hostDirectives: [BrnSheetDescription],
  host: { 'data-slot': 'sheet-description' },
})
export class HlmSheetDescription {
  constructor() {
    classes(() => 'text-muted-foreground text-sm');
  }
}
