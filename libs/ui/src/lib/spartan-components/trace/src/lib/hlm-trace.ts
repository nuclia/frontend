// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmTrace],hlm-trace',
  exportAs: 'hlmTrace',
  host: { 'data-slot': 'trace' },
})
export class HlmTrace {
  constructor() {
    classes(
      () =>
        '*:has-[>[data-slot=trace-line]]:focus-visible:ring-ring/50 gap-2 *:has-[>[data-slot=trace-line]]:rounded-md *:has-[>[data-slot=trace-line]]:focus-visible:ring-3 flex w-full min-w-0 flex-col *:has-[>[data-slot=trace-line]]:flex *:has-[>[data-slot=trace-line]]:w-fit *:has-[>[data-slot=trace-line]]:max-w-full *:has-[>[data-slot=trace-line]]:min-w-0 *:has-[>[data-slot=trace-line]]:text-left *:has-[>[data-slot=trace-line]]:outline-none',
    );
  }
}
