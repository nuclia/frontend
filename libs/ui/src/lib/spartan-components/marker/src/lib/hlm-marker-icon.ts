// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmMarkerIcon],hlm-marker-icon',
  exportAs: 'hlmMarkerIcon',
  host: {
    'data-slot': 'marker-icon',
    'aria-hidden': 'true',
  },
})
export class HlmMarkerIcon {
  constructor() {
    classes(
      () =>
        "size-4 shrink-0 [&_ng-icon:not([class*='text-'])]:text-[length:--spacing(4)]",
    );
  }
}
