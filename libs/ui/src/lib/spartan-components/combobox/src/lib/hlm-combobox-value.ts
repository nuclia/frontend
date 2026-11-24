// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { BrnComboboxValue } from '@spartan-ng/brain/combobox';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmComboboxValue],hlm-combobox-value',
  exportAs: 'hlmComboboxValue',
  hostDirectives: [{ directive: BrnComboboxValue, inputs: ['placeholder'] }],
  host: { 'data-slot': 'combobox-value' },
})
export class HlmComboboxValue {
  constructor() {
    classes(() => 'data-hidden:hidden');
  }
}
