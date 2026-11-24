// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmItemTitle],hlm-item-title',
  exportAs: 'hlmItemTitle',
  host: { 'data-slot': 'item-title' },
})
export class HlmItemTitle {
  constructor() {
    classes(
      () =>
        'gap-2 text-sm leading-snug font-medium underline-offset-4 line-clamp-1 flex w-fit items-center',
    );
  }
}
