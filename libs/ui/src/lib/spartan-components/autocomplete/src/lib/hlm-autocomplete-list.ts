// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { BrnAutocompleteList } from '@spartan-ng/brain/autocomplete';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmAutocompleteList]',
  exportAs: 'hlmAutocompleteList',
  hostDirectives: [
    {
      directive: BrnAutocompleteList,
      inputs: ['id', 'aria-label', 'aria-labelledby'],
    },
  ],
  host: { 'data-slot': 'autocomplete-list' },
})
export class HlmAutocompleteList {
  constructor() {
    classes(
      () =>
        'no-scrollbar max-h-[calc(--spacing(72)---spacing(9))] scroll-py-1 p-1 data-empty:p-0 overflow-y-auto overscroll-contain',
    );
  }
}
