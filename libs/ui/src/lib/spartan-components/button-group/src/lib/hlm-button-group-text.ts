// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmButtonGroupText],hlm-button-group-text',
  exportAs: 'hlmButtonGroupText',
  host: {
    'data-slot': 'button-group-text',
  },
})
export class HlmButtonGroupText {
  constructor() {
    classes(
      () =>
        "bg-muted gap-2 rounded-lg border px-2.5 text-sm font-medium [&_ng-icon:not([class*='text-'])]:text-[length:--spacing(4)] flex items-center [&_ng-icon]:pointer-events-none",
    );
  }
}
