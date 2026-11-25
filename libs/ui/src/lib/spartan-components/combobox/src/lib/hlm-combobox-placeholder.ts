// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { BrnComboboxPlaceholder } from '@spartan-ng/brain/combobox';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmComboboxPlaceholder],hlm-combobox-placeholder',
  exportAs: 'hlmComboboxPlaceholder',
  hostDirectives: [BrnComboboxPlaceholder],
  host: { 'data-slot': 'combobox-placeholder' },
})
export class HlmComboboxPlaceholder {
  constructor() {
    classes(
      () =>
        "gap-2 [&_ng-icon:not([class*='text-'])]:text-[length:--spacing(4)] flex items-center data-hidden:hidden [&_ng-icon]:pointer-events-none [&_ng-icon]:shrink-0",
    );
  }
}
