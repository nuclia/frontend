// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { BrnComboboxSeparator } from '@spartan-ng/brain/combobox';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmComboboxSeparator]',
  exportAs: 'hlmComboboxSeparator',
  hostDirectives: [
    { directive: BrnComboboxSeparator, inputs: ['orientation'] },
  ],
  host: { 'data-slot': 'combobox-separator' },
})
export class HlmComboboxSeparator {
  constructor() {
    classes(() => 'bg-border -mx-1 my-1 h-px');
  }
}
