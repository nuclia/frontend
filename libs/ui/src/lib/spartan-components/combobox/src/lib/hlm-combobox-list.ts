// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { BrnComboboxList } from '@spartan-ng/brain/combobox';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmComboboxList]',
  exportAs: 'hlmComboboxList',
  hostDirectives: [{ directive: BrnComboboxList, inputs: ['id'] }],
  host: { 'data-slot': 'combobox-list' },
})
export class HlmComboboxList {
  constructor() {
    classes(
      () =>
        'no-scrollbar max-h-[calc(--spacing(72)---spacing(9))] scroll-py-1 p-1 data-empty:p-0 overflow-y-auto overscroll-contain',
    );
  }
}
