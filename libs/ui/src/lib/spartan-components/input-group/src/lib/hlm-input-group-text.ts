// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmInputGroupText],hlm-input-group-text',
  exportAs: 'hlmInputGroupText',
})
export class HlmInputGroupText {
  constructor() {
    classes(
      () =>
        "text-muted-foreground gap-2 text-sm [&_ng-icon:not([class*='text-'])]:text-[length:--spacing(4)] flex items-center [&_ng-icon]:pointer-events-none",
    );
  }
}
