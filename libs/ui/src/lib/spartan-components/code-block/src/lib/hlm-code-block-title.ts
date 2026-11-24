// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmCodeBlockTitle],hlm-code-block-title',
  exportAs: 'hlmCodeBlockTitle',
  host: { 'data-slot': 'code-block-title' },
})
export class HlmCodeBlockTitle {
  constructor() {
    classes(
      () =>
        "text-foreground group-data-[variant=destructive]/code-block:text-destructive font-sans text-sm font-medium group-data-[size=sm]/code-block:text-xs [&_ng-icon:not([class*='text-'])]:text-[length:--spacing(3.5)] *:[ng-icon]:me-1.5 min-w-0 truncate [&_ng-icon]:pointer-events-none [&_ng-icon]:inline-block [&_ng-icon]:align-middle",
    );
  }
}
