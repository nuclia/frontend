// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmItemActions],hlm-item-actions',
  exportAs: 'hlmItemActions',
  host: { 'data-slot': 'item-actions' },
})
export class HlmItemActions {
  constructor() {
    classes(() => 'gap-2 flex items-center');
  }
}
