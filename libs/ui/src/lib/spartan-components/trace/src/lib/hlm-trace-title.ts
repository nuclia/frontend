// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmTraceTitle],hlm-trace-title',
  exportAs: 'hlmTraceTitle',
  host: { 'data-slot': 'trace-title' },
})
export class HlmTraceTitle {
  constructor() {
    classes(() => 'motion-reduce:shimmer-none min-w-0 truncate');
  }
}
