// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';

export const hlmMuted = 'text-sm text-muted-foreground';

@Directive({
  selector: '[hlmMuted]',
  exportAs: 'hlmMuted',
})
export class HlmMuted {
  constructor() {
    classes(() => hlmMuted);
  }
}
