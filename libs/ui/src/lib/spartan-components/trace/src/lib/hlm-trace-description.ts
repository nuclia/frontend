// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmTraceDescription],hlm-trace-description',
  exportAs: 'hlmTraceDescription',
  host: { 'data-slot': 'trace-description' },
})
export class HlmTraceDescription {
  constructor() {
    classes(() => 'text-muted-foreground/70 shrink-0 tabular-nums');
  }
}
