// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmCardDescription]',
  exportAs: 'hlmCardDescription',
  host: { 'data-slot': 'card-description' },
})
export class HlmCardDescription {
  constructor() {
    classes(() => 'text-muted-foreground text-sm');
  }
}
