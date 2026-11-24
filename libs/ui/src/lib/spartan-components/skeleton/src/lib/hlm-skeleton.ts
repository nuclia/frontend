// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmSkeleton],hlm-skeleton',
  exportAs: 'hlmSkeleton',
  host: {
    'data-slot': 'skeleton',
  },
})
export class HlmSkeleton {
  constructor() {
    classes(() => 'bg-muted rounded-md block motion-safe:animate-pulse');
  }
}
