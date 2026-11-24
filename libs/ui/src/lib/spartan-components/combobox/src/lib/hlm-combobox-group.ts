// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { BrnComboboxGroup } from '@spartan-ng/brain/combobox';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmComboboxGroup]',
  exportAs: 'hlmComboboxGroup',
  hostDirectives: [BrnComboboxGroup],
  host: { 'data-slot': 'combobox-group' },
})
export class HlmComboboxGroup {
  constructor() {
    classes(() => 'data-hidden:hidden');
  }
}
