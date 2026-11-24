// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmItemContent],hlm-item-content',
  exportAs: 'hlmItemContent',
  host: { 'data-slot': 'item-content' },
})
export class HlmItemContent {
  constructor() {
    classes(
      () =>
        'gap-1 group-data-[size=xs]/item:gap-0 flex flex-1 flex-col [&+[data-slot=item-content]]:flex-none',
    );
  }
}
