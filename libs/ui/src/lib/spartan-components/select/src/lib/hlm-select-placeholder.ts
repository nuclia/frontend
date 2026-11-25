// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { BrnSelectPlaceholder } from '@spartan-ng/brain/select';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmSelectPlaceholder],hlm-select-placeholder',
  exportAs: 'hlmSelectPlaceholder',
  hostDirectives: [BrnSelectPlaceholder],
  host: { 'data-slot': 'select-placeholder' },
})
export class HlmSelectPlaceholder {
  constructor() {
    classes(
      () =>
        "gap-2 [&_ng-icon:not([class*='text-'])]:text-[length:--spacing(4)] flex items-center data-hidden:hidden [&_ng-icon]:pointer-events-none [&_ng-icon]:shrink-0",
    );
  }
}
