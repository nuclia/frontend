// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';

export const hlmLead = 'text-xl text-muted-foreground';

@Directive({
  selector: '[hlmLead]',
  exportAs: 'hlmLead',
})
export class HlmLead {
  constructor() {
    classes(() => hlmLead);
  }
}
