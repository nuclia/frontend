// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmCardTitle]',
  exportAs: 'hlmCardTitle',
  host: { 'data-slot': 'card-title' },
})
export class HlmCardTitle {
  constructor() {
    classes(
      () =>
        'text-base leading-snug font-medium group-data-[size=sm]/card:text-sm',
    );
  }
}
