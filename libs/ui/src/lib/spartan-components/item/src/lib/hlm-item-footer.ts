// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmItemFooter],hlm-item-footer',
  exportAs: 'hlmItemFooter',
  host: { 'data-slot': 'item-footer' },
})
export class HlmItemFooter {
  constructor() {
    classes(() => 'gap-2 flex basis-full items-center justify-between');
  }
}
