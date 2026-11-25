// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmTraceIcon],hlm-trace-icon',
  exportAs: 'hlmTraceIcon',
  host: { 'data-slot': 'trace-icon', '[attr.aria-hidden]': 'true' },
})
export class HlmTraceIcon {
  constructor() {
    classes(
      () =>
        "size-4 [&_ng-icon:not([class*='text-'])]:text-[length:--spacing(4)] [[data-slot=trace-title]~&]:-ml-1 flex shrink-0 items-center justify-center [&_ng-icon]:pointer-events-none",
    );
  }
}
