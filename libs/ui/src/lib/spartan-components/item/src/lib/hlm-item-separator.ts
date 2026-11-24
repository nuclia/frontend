// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { BrnSeparator } from '@spartan-ng/brain/separator';
import { hlmSeparatorClass } from '@progress/pdp-ui-spartan/separator';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmItemSeparator],hlm-item-separator',
  exportAs: 'hlmItemSeparator',
  hostDirectives: [{ directive: BrnSeparator, inputs: ['orientation'] }],
  host: { 'data-slot': 'item-separator' },
})
export class HlmItemSeparator {
  constructor() {
    classes(() => [hlmSeparatorClass, 'my-2']);
  }
}
