// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmItemHeader],hlm-item-header',
  exportAs: 'hlmItemHeader',
  host: { 'data-slot': 'item-header' },
})
export class HlmItemHeader {
  constructor() {
    classes(() => 'gap-2 flex basis-full items-center justify-between');
  }
}
